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

export async function getClients() {
    const session = await getSession()
    if (!session?.user?.tenantId) return []

    return await db.client.findMany({
        where: {
            tenantId: session.user.tenantId
        },
        orderBy: {
            createdAt: "desc"
        }
    })
}

export async function getClientById(id: string) {
    const session = await getSession()
    if (!session?.user?.tenantId) return null

    return await db.client.findFirst({
        where: {
            id,
            tenantId: session.user.tenantId
        },
        include: {
            appointments: true,
            activities: true,
            conversations: { select: { channel: true } },
        }
    })
}

export async function createClient(formData: FormData) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    if (!firstName || !lastName || !email) {
        return { error: "Missing fields" }
    }

    try {
        const client = await db.client.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                address,
                tenantId: session.user.tenantId
            }
        })

        await logActivity(
            `Created client: ${firstName} ${lastName}`,
            "STATUS_CHANGE",
            { clientId: client.id }
        )
    } catch (e) {
        return { error: "Failed to create client" }
    }

    revalidatePath("/dashboard/clients")
    redirect("/dashboard/clients")
}

export async function updateClient(
    id: string,
    data: { firstName: string; lastName: string; email: string; phone?: string; address?: string }
) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const existing = await db.client.findFirst({
        where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return { error: "Client not found" }

    try {
        const updated = await db.client.update({
            where: { id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || null,
                address: data.address || null,
            },
        })

        revalidatePath(`/dashboard/clients/${id}`)
        revalidatePath("/dashboard/clients")

        return { client: updated }
    } catch {
        return { error: "Failed to update client" }
    }
}

export async function updateClientChannels(
    id: string,
    data: { phone?: string; email?: string; whatsappNumber?: string; instagramUsername?: string; messengerId?: string }
) {
    const session = await getSession()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    const existing = await db.client.findFirst({
        where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return { error: "Client not found" }

    try {
        await db.client.update({
            where: { id },
            data: {
                phone: data.phone !== undefined ? (data.phone || null) : existing.phone,
                email: data.email !== undefined ? data.email : existing.email,
                whatsappNumber: data.whatsappNumber !== undefined ? (data.whatsappNumber || null) : existing.whatsappNumber,
                instagramUsername: data.instagramUsername !== undefined ? (data.instagramUsername || null) : existing.instagramUsername,
                messengerId: data.messengerId !== undefined ? (data.messengerId || null) : existing.messengerId,
            },
        })

        revalidatePath(`/dashboard/clients/${id}`)
        return { success: true }
    } catch {
        return { error: "Failed to update channels" }
    }
}

export async function deleteClient(id: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const tenantId = (session.user as any).tenantId

    const client = await db.client.findUnique({
        where: { id, tenantId }
    })

    if (!client) {
        throw new Error("Client not found or access denied")
    }

    await db.client.delete({
        where: { id }
    })

    revalidatePath("/dashboard/clients")
}
