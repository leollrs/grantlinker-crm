import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { twilioClient, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER } from "@/lib/twilio"
import { sendMetaMessage, sendMetaMessageWithToken } from "@/lib/meta"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const tenantId = (session.user as any).tenantId

    const { conversationId, body, toPhone, channel: requestChannel } = await req.json()

    if (!body?.trim()) {
        return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    let conversation: any

    if (conversationId) {
        // Existing conversation — guard with tenantId
        conversation = await db.conversation.findFirst({
            where: { id: conversationId, tenantId },
        })
        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
        }
    } else if (toPhone) {
        // New conversation — find or create
        const normalizedPhone = toPhone.replace(/\s/g, "")
        const newChannel = requestChannel || "sms"
        conversation = await db.conversation.findFirst({
            where: { tenantId, phoneNumber: normalizedPhone, channel: newChannel },
        })
        if (!conversation) {
            let clientId: string | null = null
            let leadId: string | null = null

            const client = await db.client.findFirst({
                where: { tenantId, phone: normalizedPhone },
            })
            if (client) {
                clientId = client.id
            } else {
                const lead = await db.lead.findFirst({
                    where: { tenantId, phone: normalizedPhone },
                })
                if (lead) leadId = lead.id
            }

            conversation = await db.conversation.create({
                data: {
                    tenantId,
                    phoneNumber: normalizedPhone,
                    channel: newChannel,
                    clientId,
                    leadId,
                    lastMessageAt: new Date(),
                },
            })
        }
    } else {
        return NextResponse.json(
            { error: "conversationId or toPhone required" },
            { status: 400 }
        )
    }

    const isMeta = conversation.channel === "instagram" || conversation.channel === "facebook"
    let twilioSid: string | null = null
    let metaMessageId: string | null = null
    let status = "sent"

    if (isMeta) {
        // Send via Meta Graph API
        const metaSenderId = conversation.metaSenderId
        if (!metaSenderId) {
            return NextResponse.json({ error: "Missing Meta sender ID" }, { status: 400 })
        }

        // Look up per-tenant Meta page token from DB
        const metaPage = await db.metaPage.findFirst({
            where: { tenantId, isActive: true },
        })

        let result: { messageId: string | null; success: boolean }
        if (metaPage) {
            result = await sendMetaMessageWithToken(
                metaSenderId,
                body.trim(),
                metaPage.pageId,
                metaPage.pageAccessToken,
                conversation.channel as "facebook" | "instagram"
            )
        } else {
            // Fallback to env var token
            result = await sendMetaMessage(metaSenderId, body.trim(), conversation.channel as "facebook" | "instagram")
        }

        metaMessageId = result.messageId
        if (!result.success) status = "failed"
    } else {
        // Send via Twilio (prefix whatsapp: for WhatsApp channel)
        const isWhatsApp = conversation.channel === "whatsapp"
        const toNumber = isWhatsApp ? `whatsapp:${conversation.phoneNumber}` : conversation.phoneNumber
        const fromNumber = isWhatsApp ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}` : TWILIO_PHONE_NUMBER

        if (twilioClient) {
            try {
                const twilioMsg = await twilioClient.messages.create({
                    body: body.trim(),
                    from: fromNumber,
                    to: toNumber,
                })
                twilioSid = twilioMsg.sid
            } catch (err) {
                console.error("Twilio send error:", err)
                status = "failed"
            }
        } else {
            console.log(`[DEV] ${conversation.channel} to ${conversation.phoneNumber}: ${body.trim()}`)
        }
    }

    const message = await db.message.create({
        data: {
            conversationId: conversation.id,
            body: body.trim(),
            direction: "outbound",
            status,
            twilioSid,
            metaMessageId,
        },
    })

    await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
    })

    return NextResponse.json({ message, conversationId: conversation.id }, { status: 201 })
}
