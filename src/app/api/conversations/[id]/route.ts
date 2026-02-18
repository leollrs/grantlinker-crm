import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const tenantId = (session.user as any).tenantId
    const { id } = await params

    const conversation = await db.conversation.findFirst({
        where: { id, tenantId },
        include: {
            messages: { orderBy: { createdAt: "asc" } },
            lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Reset unread count when viewing
    if (conversation.unreadCount > 0) {
        await db.conversation.update({
            where: { id },
            data: { unreadCount: 0 },
        })
    }

    return NextResponse.json(conversation)
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const tenantId = (session.user as any).tenantId
    const { id } = await params

    const conversation = await db.conversation.findFirst({
        where: { id, tenantId },
    })
    if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const body = await req.json()

    const allowed: Record<string, any> = {}
    if (body.status !== undefined) allowed.status = body.status
    if (body.displayName !== undefined) allowed.displayName = body.displayName || null
    if (body.notes !== undefined) allowed.notes = body.notes || null
    if (body.leadId !== undefined) allowed.leadId = body.leadId || null
    if (body.clientId !== undefined) allowed.clientId = body.clientId || null

    // If linking to a lead, unlink client and vice versa
    if (body.leadId) allowed.clientId = null
    if (body.clientId) allowed.leadId = null

    const updated = await db.conversation.update({
        where: { id },
        data: allowed,
        include: {
            lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
    })

    return NextResponse.json(updated)
}
