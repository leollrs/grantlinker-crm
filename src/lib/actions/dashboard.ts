"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGoogleCalendarEvents } from "@/lib/actions/appointments"

export async function getDashboardStats() {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).tenantId) {
        return {
            leads: 0,
            clients: 0,
            appointments: 0,
        }
    }

    const tenantId = (session.user as any).tenantId

    const [leadsCount, clientsCount, appointmentsCount] = await Promise.all([
        db.lead.count({
            where: { tenantId, convertedClientId: null },
        }),
        db.client.count({
            where: { tenantId },
        }),
        db.appointment.count({
            where: {
                tenantId,
                status: "SCHEDULED"
            },
        }),
    ])

    return {
        leads: leadsCount,
        clients: clientsCount,
        appointments: appointmentsCount,
    }
}

export async function getUpcomingAppointments() {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).tenantId) return []

    const tenantId = (session.user as any).tenantId

    return await db.appointment.findMany({
        where: {
            tenantId,
            startTime: { gte: new Date() },
            status: "SCHEDULED",
        },
        include: {
            client: true,
            lead: true,
        },
        orderBy: { startTime: "asc" },
        take: 5,
    })
}

export async function getNewGoogleCalendarEvents() {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).tenantId) return []

    const tenantId = (session.user as any).tenantId

    // Get all googleEventIds we already know about
    const localAppointments = await db.appointment.findMany({
        where: { tenantId, googleEventId: { not: null } },
        select: { googleEventId: true },
    })
    const knownGoogleIds = new Set(localAppointments.map(a => a.googleEventId))

    // Get Google Calendar events
    const googleEvents = await getGoogleCalendarEvents()

    // Filter to only upcoming events not created by the CRM
    const now = new Date()
    return googleEvents.filter((e: any) => {
        const googleId = e.id.replace("google-", "")
        const isKnown = knownGoogleIds.has(googleId)
        const isUpcoming = new Date(e.startTime) > now
        return !isKnown && isUpcoming
    })
}
