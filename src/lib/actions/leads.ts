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

export async function getLeads() {
    const session = await getSession()
    if (!session?.user?.tenantId) return []

    return await db.lead.findMany({
        where: {
            tenantId: session.user.tenantId,
            convertedClientId: null, // Hide converted leads
        },
        orderBy: {
            createdAt: "desc"
        }
    })
}

export async function getLeadById(id: string) {
    const session = await getSession()
    if (!session?.user?.tenantId) return null

    return await db.lead.findFirst({
        where: {
            id,
            tenantId: session.user.tenantId
        },
        include: {
            activities: true,
            appointments: true,
            conversations: { select: { channel: true } },
            convertedClient: {
                include: { appointments: true }
            },
        }
    })
}

export async function deleteLead(id: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const tenantId = (session.user as any).tenantId
    // Verify lead belongs to tenant before deleting
    const lead = await db.lead.findUnique({
        where: { id, tenantId }
    })

    if (!lead) {
        throw new Error("Lead not found or access denied")
    }

    await db.lead.delete({
        where: { id }
    })

    // Log the deletion (optional but good for audit)
    // await logActivity(`Deleted lead: ${lead.firstName} ${lead.lastName}`, "STATUS_CHANGE", { ... })

    revalidatePath("/dashboard/leads")
    redirect("/dashboard/leads")
}

export async function updateLead(
    id: string,
    data: { firstName: string; lastName: string; email: string; phone?: string; address?: string; companyName?: string; status?: string; value?: number }
) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const existing = await db.lead.findFirst({
        where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return { error: "Lead not found" }

    try {
        const updated = await db.lead.update({
            where: { id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || null,
                address: data.address || null,
                companyName: data.companyName || null,
                status: data.status || existing.status,
                value: data.value !== undefined ? data.value : existing.value,
            },
        })

        revalidatePath(`/dashboard/leads/${id}`)
        revalidatePath("/dashboard/leads")

        return { lead: updated }
    } catch {
        return { error: "Failed to update lead" }
    }
}

export async function updateLeadChannels(
    id: string,
    data: { phone?: string; email?: string; whatsappNumber?: string; instagramUsername?: string; messengerId?: string }
) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const existing = await db.lead.findFirst({
        where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return { error: "Lead not found" }

    try {
        await db.lead.update({
            where: { id },
            data: {
                phone: data.phone !== undefined ? (data.phone || null) : existing.phone,
                email: data.email !== undefined ? data.email : existing.email,
                whatsappNumber: data.whatsappNumber !== undefined ? (data.whatsappNumber || null) : existing.whatsappNumber,
                instagramUsername: data.instagramUsername !== undefined ? (data.instagramUsername || null) : existing.instagramUsername,
                messengerId: data.messengerId !== undefined ? (data.messengerId || null) : existing.messengerId,
            },
        })

        revalidatePath(`/dashboard/leads/${id}`)
        return { success: true }
    } catch {
        return { error: "Failed to update channels" }
    }
}

export async function convertLeadToClient(leadId: string, force = false) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const lead = await db.lead.findFirst({
        where: { id: leadId, tenantId: session.user.tenantId },
    })
    if (!lead) return { error: "Lead not found" }

    // If already converted, return the existing client
    if (lead.convertedClientId) {
        return { clientId: lead.convertedClientId }
    }

    // Check for existing client with same email or phone (unless forced)
    if (!force) {
        const conditions: any[] = []
        if (lead.email) conditions.push({ email: lead.email })
        if (lead.phone) conditions.push({ phone: lead.phone })

        if (conditions.length > 0) {
            const existingClient = await db.client.findFirst({
                where: {
                    tenantId: session.user.tenantId,
                    OR: conditions,
                },
            })

            if (existingClient) {
                return {
                    error: "duplicate",
                    existingClient: {
                        id: existingClient.id,
                        name: `${existingClient.firstName} ${existingClient.lastName}`,
                    },
                }
            }
        }
    }

    try {
        const client = await db.client.create({
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

        // Mark lead as converted and link to client
        await db.lead.update({
            where: { id: leadId },
            data: { status: "WON", convertedClientId: client.id },
        })

        // Transfer conversations from lead to client
        await db.conversation.updateMany({
            where: { leadId, tenantId: session.user.tenantId },
            data: { clientId: client.id, leadId: null },
        })

        // Transfer appointments from lead to client
        await db.appointment.updateMany({
            where: { leadId, tenantId: session.user.tenantId },
            data: { clientId: client.id, leadId: null },
        })

        // Remove lead after successful conversion
        await db.lead.delete({
            where: { id: leadId, tenantId: session.user.tenantId },
        })

        await logActivity(
            `Converted lead to client: ${lead.firstName} ${lead.lastName}`,
            "STATUS_CHANGE",
            { clientId: client.id }
        )

        revalidatePath("/dashboard/leads")
        revalidatePath("/dashboard/clients")

        return { clientId: client.id }
    } catch {
        return { error: "Failed to convert lead" }
    }
}

export async function linkLeadToClient(leadId: string, clientId: string) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    try {
        const lead = await db.lead.findFirst({
            where: { id: leadId, tenantId: session.user.tenantId },
        })
        if (!lead) return { error: "Lead not found" }

        // Transfer conversations
        await db.conversation.updateMany({
            where: { leadId, tenantId: session.user.tenantId },
            data: { clientId, leadId: null },
        })

        // Transfer appointments
        await db.appointment.updateMany({
            where: { leadId, tenantId: session.user.tenantId },
            data: { clientId, leadId: null },
        })

        // Remove lead after linking to existing client
        await db.lead.delete({
            where: { id: leadId, tenantId: session.user.tenantId },
        })

        await logActivity(
            `Linked lead to existing client: ${lead.firstName} ${lead.lastName}`,
            "STATUS_CHANGE",
            { clientId }
        )

        revalidatePath("/dashboard/leads")
        revalidatePath("/dashboard/clients")

        return { clientId }
    } catch {
        return { error: "Failed to link lead to client" }
    }
}

export async function createLead(formData: FormData) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const status = formData.get("status") as string || "NEW"

    if (!firstName || !lastName || !email) {
        return { error: "Missing fields" }
    }

    try {
        const lead = await db.lead.create({
            data: {
                firstName,
                lastName,
                email,
                status,
                tenantId: session.user.tenantId
            }
        })

        await logActivity(
            `Created lead: ${firstName} ${lastName}`,
            "STATUS_CHANGE",
            { leadId: lead.id }
        )
    } catch (e) {
        return { error: "Failed to create lead" }
    }

    revalidatePath("/dashboard/leads")
    redirect("/dashboard/leads")
}
