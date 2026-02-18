import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { META_VERIFY_TOKEN, META_PAGE_ACCESS_TOKEN, META_PAGE_ID, getMetaProfileWithToken, getMetaProfile } from "@/lib/meta"

// GET — Meta webhook verification
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse("Forbidden", { status: 403 })
}

// POST — Incoming messages from Instagram / Facebook Messenger
export async function POST(req: Request) {
    const { searchParams } = new URL(req.url)
    const fallbackTenantId = searchParams.get("tenantId")

    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    console.log("[Meta Webhook] Received:", JSON.stringify(body, null, 2))

    // Respond immediately — Meta requires 200 within 5 seconds
    try {
        await processWebhook(body, fallbackTenantId)
    } catch (err) {
        console.error("Meta webhook processing error:", err)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
}

async function processWebhook(body: any, fallbackTenantId: string | null) {
    const objectType = body.object // "page" for Messenger, "instagram" for IG
    const entries = body.entry || []

    for (const entry of entries) {
        const messaging = entry.messaging || []
        const channel = objectType === "instagram" ? "instagram" : "facebook"
        const entryPageId = entry.id // The page/IG account that received the message

        // Resolve tenant from DB by page ID
        let tenantId: string | null = null
        let pageAccessToken: string | null = null

        // Look up by pageId first, then by igBusinessAccountId for Instagram webhooks
        let metaPage = await db.metaPage.findFirst({
            where: { pageId: entryPageId, isActive: true },
        })
        if (!metaPage && channel === "instagram") {
            metaPage = await db.metaPage.findFirst({
                where: { igBusinessAccountId: entryPageId, isActive: true },
            })
        }

        if (metaPage) {
            tenantId = metaPage.tenantId
            pageAccessToken = metaPage.pageAccessToken
        } else {
            // Fallback: use ?tenantId= query param + env var token
            tenantId = fallbackTenantId
            if (entryPageId === META_PAGE_ID || !META_PAGE_ID) {
                pageAccessToken = META_PAGE_ACCESS_TOKEN || null
            }
        }

        if (!tenantId) {
            console.log("[Meta Webhook] Could not resolve tenant for page:", entryPageId)
            continue
        }

        for (const event of messaging) {
            const timestamp = event.timestamp
                ? new Date(event.timestamp)
                : new Date()

            // Standard message event (Facebook Messenger + Instagram with full permissions)
            if (event.message?.text && event.sender?.id) {
                await handleIncomingMessage({
                    senderId: event.sender.id,
                    messageText: event.message.text,
                    messageId: event.message.mid,
                    timestamp,
                    channel,
                    tenantId,
                    pageAccessToken,
                })
                continue
            }

            // Instagram message_edit with num_edit=0 means new message notification
            // Fetch the actual message content via the Conversations API
            if (event.message_edit && event.sender?.id) {
                const mid = event.message_edit.mid
                const senderId = event.sender.id
                const messageText = await fetchInstagramMessageText(mid, pageAccessToken)

                if (messageText) {
                    await handleIncomingMessage({
                        senderId,
                        messageText,
                        messageId: mid,
                        timestamp,
                        channel,
                        tenantId,
                        pageAccessToken,
                    })
                } else {
                    console.log("[Meta Webhook] Could not fetch IG message text for mid:", mid)
                }
                continue
            }

            // Instagram message_edit without sender — try to get from conversations API
            if (event.message_edit && !event.sender?.id) {
                const mid = event.message_edit.mid
                console.log("[Meta Webhook] IG message_edit without sender, mid:", mid)

                const msgDetails = await fetchInstagramMessageDetails(mid, pageAccessToken)
                if (msgDetails) {
                    await handleIncomingMessage({
                        senderId: msgDetails.senderId,
                        messageText: msgDetails.text,
                        messageId: mid,
                        timestamp,
                        channel,
                        tenantId,
                        pageAccessToken,
                    })
                }
                continue
            }

            console.log("[Meta Webhook] Unhandled event type:", JSON.stringify(event).slice(0, 200))
        }
    }
}

async function fetchInstagramMessageText(mid: string, accessToken: string | null): Promise<string | null> {
    const token = accessToken || META_PAGE_ACCESS_TOKEN
    if (!token) return null

    try {
        const res = await fetch(
            `https://graph.facebook.com/v21.0/${mid}?fields=message&access_token=${token}`
        )
        const data = await res.json()
        console.log("[Meta Webhook] Fetched IG message:", JSON.stringify(data))
        return data.message || null
    } catch (err) {
        console.error("[Meta Webhook] Failed to fetch IG message:", err)
        return null
    }
}

async function fetchInstagramMessageDetails(mid: string, accessToken: string | null): Promise<{ senderId: string; text: string } | null> {
    const token = accessToken || META_PAGE_ACCESS_TOKEN
    if (!token) return null

    try {
        const res = await fetch(
            `https://graph.facebook.com/v21.0/${mid}?fields=message,from&access_token=${token}`
        )
        const data = await res.json()
        console.log("[Meta Webhook] Fetched IG message details:", JSON.stringify(data))
        if (data.message && data.from?.id) {
            return { senderId: data.from.id, text: data.message }
        }
        return null
    } catch (err) {
        console.error("[Meta Webhook] Failed to fetch IG message details:", err)
        return null
    }
}

async function handleIncomingMessage(params: {
    senderId: string
    messageText: string
    messageId: string | null
    timestamp: Date
    channel: string
    tenantId: string
    pageAccessToken: string | null
}) {
    const { senderId, messageText, messageId, timestamp, channel, tenantId, pageAccessToken } = params

    // Verify tenant exists
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return

    // Fetch sender profile from Meta — use token-parameterized version if we have a token
    const profile = pageAccessToken
        ? await getMetaProfileWithToken(senderId, channel as "facebook" | "instagram", pageAccessToken)
        : await getMetaProfile(senderId, channel as "facebook" | "instagram")

    // Find existing conversation by metaSenderId + channel
    let conversation = await db.conversation.findFirst({
        where: { tenantId, metaSenderId: senderId, channel },
    })

    if (!conversation) {
        // Auto-create lead for new Meta contact
        const newLead = await db.lead.create({
            data: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: `${channel}-${senderId}@meta.invalid`,
                source: channel,
                tenantId,
            },
        })

        conversation = await db.conversation.create({
            data: {
                tenantId,
                phoneNumber: `${profile.firstName} ${profile.lastName}`,
                channel,
                metaSenderId: senderId,
                leadId: newLead.id,
                lastMessageAt: timestamp,
                unreadCount: 1,
            },
        })
    } else {
        conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: timestamp,
                unreadCount: { increment: 1 },
            },
        })
    }

    // Deduplicate — skip if this metaMessageId already exists
    if (messageId) {
        const existing = await db.message.findFirst({
            where: { metaMessageId: messageId },
        })
        if (existing) return
    }

    // Create inbound message
    await db.message.create({
        data: {
            conversationId: conversation.id,
            body: messageText,
            direction: "inbound",
            status: "received",
            metaMessageId: messageId || null,
        },
    })

    console.log(`[Meta Webhook] Saved ${channel} message from ${senderId}: "${messageText}"`)
}
