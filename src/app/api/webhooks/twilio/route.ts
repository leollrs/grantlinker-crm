import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
        return new NextResponse("Missing tenantId", { status: 400 })
    }

    // Parse Twilio's application/x-www-form-urlencoded body
    const formData = await req.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
        params[key] = value.toString()
    })

    // Validate Twilio signature in production
    if (process.env.NODE_ENV === "production") {
        const authToken = process.env.TWILIO_AUTH_TOKEN
        const twilioSignature = req.headers.get("X-Twilio-Signature") || ""
        const url = `${process.env.NEXTAUTH_URL}/api/webhooks/twilio?tenantId=${tenantId}`

        if (authToken) {
            const isValid = twilio.validateRequest(authToken, twilioSignature, url, params)
            if (!isValid) {
                return new NextResponse("Invalid signature", { status: 403 })
            }
        }
    }

    const fromPhone = params["From"] || ""
    const body = params["Body"] || ""
    const messageSid = params["MessageSid"] || null

    if (!fromPhone || !body) {
        return new NextResponse("Missing From or Body", { status: 400 })
    }

    // Verify tenant exists
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
        return new NextResponse("Tenant not found", { status: 404 })
    }

    // Detect channel: WhatsApp messages arrive as "whatsapp:+1234567890"
    const isWhatsApp = fromPhone.startsWith("whatsapp:")
    const channel = isWhatsApp ? "whatsapp" : "sms"
    const normalizedPhone = fromPhone.replace("whatsapp:", "").replace(/\s/g, "")

    // Match phone to existing Client or Lead
    let leadId: string | null = null
    let clientId: string | null = null

    const existingClient = await db.client.findFirst({
        where: { tenantId, phone: normalizedPhone },
    })

    if (existingClient) {
        clientId = existingClient.id
    } else {
        const existingLead = await db.lead.findFirst({
            where: { tenantId, phone: normalizedPhone },
        })

        if (existingLead) {
            leadId = existingLead.id
        } else {
            // Auto-create Lead for unknown number
            const newLead = await db.lead.create({
                data: {
                    firstName: "Unknown",
                    lastName: normalizedPhone,
                    email: `${channel}-${normalizedPhone.replace(/\+/g, "")}@unknown.invalid`,
                    phone: normalizedPhone,
                    source: channel,
                    tenantId,
                },
            })
            leadId = newLead.id
        }
    }

    // Find or create Conversation (scoped by phone + channel)
    let conversation = await db.conversation.findFirst({
        where: { tenantId, phoneNumber: normalizedPhone, channel },
    })

    if (!conversation) {
        conversation = await db.conversation.create({
            data: {
                tenantId,
                phoneNumber: normalizedPhone,
                channel,
                leadId,
                clientId,
                lastMessageAt: new Date(),
                unreadCount: 1,
            },
        })
    } else {
        conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                unreadCount: { increment: 1 },
            },
        })
    }

    // Create inbound Message
    await db.message.create({
        data: {
            conversationId: conversation.id,
            body,
            direction: "inbound",
            status: "received",
            twilioSid: messageSid,
        },
    })

    // Return empty TwiML (no auto-reply)
    return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
    )
}
