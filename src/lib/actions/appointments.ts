"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "./activities"

async function getSession() {
    return await getServerSession(authOptions)
}

export async function getAppointments() {
    const session = await getSession()
    if (!session?.user?.tenantId) return []

    return await db.appointment.findMany({
        where: {
            tenantId: session.user.tenantId
        },
        include: {
            client: true,
            lead: true,
            user: { select: { name: true } },
        },
        orderBy: {
            startTime: "asc"
        }
    })
}

async function getGoogleAccessToken(userId: string): Promise<string | null> {
    const account = await db.account.findFirst({
        where: { userId, provider: "google-calendar" }
    })
    if (!account) return null

    // Refresh if token expires within 5 minutes
    if (account.expires_at && account.expires_at < Math.floor(Date.now() / 1000) + 300) {
        if (!account.refresh_token) return null

        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                refresh_token: account.refresh_token,
                grant_type: "refresh_token",
            }),
        })

        const tokens = await res.json()
        if (!res.ok) return null

        await db.account.update({
            where: { id: account.id },
            data: {
                access_token: tokens.access_token,
                expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
            },
        })

        return tokens.access_token
    }

    return account.access_token
}

export async function getGoogleCalendarEvents() {
    const session = await getSession()
    if (!session?.user?.id) return []

    const accessToken = await getGoogleAccessToken(session.user.id)
    if (!accessToken) return []

    try {
        const now = new Date()
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 0)

        const params = new URLSearchParams({
            timeMin: threeMonthsAgo.toISOString(),
            timeMax: threeMonthsAhead.toISOString(),
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "250",
        })

        const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        if (!res.ok) return []

        const data = await res.json()

        return (data.items || [])
            .filter((e: any) => e.start?.dateTime || e.start?.date)
            .map((e: any) => ({
                id: `google-${e.id}`,
                title: e.summary || "(No title)",
                startTime: e.start.dateTime || e.start.date,
                endTime: e.end?.dateTime || e.end?.date || e.start.dateTime || e.start.date,
                source: "google" as const,
            }))
    } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error)
        return []
    }
}

export async function createAppointment(formData: FormData) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const clientId = formData.get("clientId") as string
    const leadId = formData.get("leadId") as string

    if (!title || !startTime || !endTime) {
        return { error: "Missing fields" }
    }

    if (new Date(endTime) <= new Date(startTime)) {
        return { error: "End time must be after start time" }
    }

    // Auto-convert lead to client when appointment is linked to a lead
    let resolvedClientId = clientId || null
    if (leadId && !resolvedClientId) {
        const lead = await db.lead.findFirst({
            where: { id: leadId, tenantId: session.user.tenantId },
        })
        if (lead) {
            if (lead.convertedClientId) {
                // Already converted — use existing client
                resolvedClientId = lead.convertedClientId
            } else {
                // Auto-convert: create client from lead
                const newClient = await db.client.create({
                    data: {
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        email: lead.email,
                        phone: lead.phone,
                        address: lead.address,
                        whatsappNumber: lead.whatsappNumber,
                        instagramUsername: lead.instagramUsername,
                        messengerId: lead.messengerId,
                        tenantId: session.user.tenantId,
                    },
                })

                await db.lead.update({
                    where: { id: leadId },
                    data: { status: "WON", convertedClientId: newClient.id },
                })

                // Transfer conversations
                await db.conversation.updateMany({
                    where: { leadId, tenantId: session.user.tenantId },
                    data: { clientId: newClient.id, leadId: null },
                })

                // Transfer existing lead appointments to client
                await db.appointment.updateMany({
                    where: { leadId, tenantId: session.user.tenantId },
                    data: { clientId: newClient.id },
                })

                await logActivity(
                    `Auto-converted lead to client (appointment booked): ${lead.firstName} ${lead.lastName}`,
                    "STATUS_CHANGE",
                    { leadId, clientId: newClient.id }
                )

                resolvedClientId = newClient.id
                revalidatePath("/dashboard/leads")
                revalidatePath("/dashboard/clients")
            }
        }
    }

    try {
        const appointment = await db.appointment.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                clientId: resolvedClientId,
                leadId: leadId || null,
                userId: session.user.id,
                tenantId: session.user.tenantId
            }
        })

        // Sync with Google Calendar
        try {
            const accessToken = await getGoogleAccessToken(session.user.id)
            if (accessToken) {
                const res = await fetch(
                    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            summary: title,
                            description: description || undefined,
                            start: { dateTime: new Date(startTime).toISOString() },
                            end: { dateTime: new Date(endTime).toISOString() },
                        }),
                    }
                )

                if (res.ok) {
                    const event = await res.json()
                    if (event.id) {
                        await db.appointment.update({
                            where: { id: appointment.id },
                            data: { googleEventId: event.id }
                        })
                    }
                }
            }
        } catch (error) {
            console.error("Google Calendar Sync Error:", error)
        }

    } catch (e) {
        return { error: "Failed to create appointment" }
    }

    revalidatePath("/dashboard/appointments")
    redirect("/dashboard/appointments")
}

export async function deleteAppointment(id: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const tenantId = (session.user as any).tenantId

    const appointment = await db.appointment.findUnique({
        where: { id, tenantId }
    })

    if (!appointment) {
        throw new Error("Appointment not found or access denied")
    }

    // Delete from Google Calendar if linked
    if (appointment.googleEventId) {
        try {
            const accessToken = await getGoogleAccessToken(session.user.id!)
            if (accessToken) {
                await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleEventId}`,
                    {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                )
            }
        } catch (error) {
            console.error("Google Calendar Delete Error:", error)
        }
    }

    await db.appointment.delete({
        where: { id }
    })

    revalidatePath("/dashboard/appointments")
    revalidatePath("/dashboard/calendar")
}

export async function deleteGoogleCalendarEvent(googleEventId: string) {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const accessToken = await getGoogleAccessToken(session.user.id)
    if (!accessToken) throw new Error("Google Calendar not connected")

    // Remove the "google-" prefix if present
    const eventId = googleEventId.replace("google-", "")

    await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    )

    revalidatePath("/dashboard/calendar")
}
