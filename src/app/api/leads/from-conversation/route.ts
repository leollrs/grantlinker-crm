import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const tenantId = (session.user as any).tenantId

    const { conversationId } = await req.json()
    if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 })
    }

    const conversation = await db.conversation.findFirst({
        where: { id: conversationId, tenantId },
    })
    if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Derive name from displayName or phoneNumber
    const name = conversation.displayName || conversation.phoneNumber
    const parts = name.split(" ")
    const firstName = parts[0] || "Unknown"
    const lastName = parts.slice(1).join(" ") || ""

    const isMeta = conversation.channel === "instagram" || conversation.channel === "facebook"

    const lead = await db.lead.create({
        data: {
            tenantId,
            firstName,
            lastName,
            email: isMeta ? `${conversation.channel}-${conversation.metaSenderId || conversation.id}@meta.invalid` : "",
            phone: isMeta ? null : conversation.phoneNumber,
            source: conversation.channel,
        },
    })

    // Link conversation to this lead
    await db.conversation.update({
        where: { id: conversationId },
        data: { leadId: lead.id, clientId: null },
    })

    return NextResponse.json(lead, { status: 201 })
}
