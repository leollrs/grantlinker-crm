"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function getSession() {
    return await getServerSession(authOptions)
}

export async function getConversations(includeArchived = false) {
    const session = await getSession()
    if (!session?.user) return []
    const tenantId = (session.user as any).tenantId
    if (!tenantId) return []

    const statusFilter = includeArchived
        ? { in: ["active", "archived"] }
        : "active"

    return await db.conversation.findMany({
        where: { tenantId, status: statusFilter },
        include: {
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            lead: { select: { id: true, firstName: true, lastName: true } },
            client: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { lastMessageAt: "desc" },
    })
}

export async function getConversation(id: string) {
    const session = await getSession()
    if (!session?.user) return null
    const tenantId = (session.user as any).tenantId

    return await db.conversation.findFirst({
        where: { id, tenantId },
        include: {
            messages: { orderBy: { createdAt: "asc" } },
            lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
    })
}

export async function markAsRead(conversationId: string) {
    const session = await getSession()
    if (!session?.user) throw new Error("Unauthorized")
    const tenantId = (session.user as any).tenantId

    const conversation = await db.conversation.findFirst({
        where: { id: conversationId, tenantId },
    })
    if (!conversation) throw new Error("Not found")

    await db.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
    })

    revalidatePath("/dashboard/inbox")
}
