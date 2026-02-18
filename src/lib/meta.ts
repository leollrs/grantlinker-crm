export const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || ""
export const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || ""
export const META_PAGE_ID = process.env.META_PAGE_ID || ""
export const META_APP_ID = process.env.META_APP_ID || ""
export const META_APP_SECRET = process.env.META_APP_SECRET || ""

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

export async function sendMetaMessage(
    recipientId: string,
    text: string,
    channel: "facebook" | "instagram" = "facebook"
): Promise<{ messageId: string | null; success: boolean }> {
    if (!META_PAGE_ACCESS_TOKEN) {
        console.log(`[DEV] Meta ${channel} message to ${recipientId}: ${text}`)
        return { messageId: null, success: true }
    }

    try {
        const endpoint = `${GRAPH_API_BASE}/${META_PAGE_ID}/messages`

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
                messaging_type: "RESPONSE",
                access_token: META_PAGE_ACCESS_TOKEN,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error(`Meta ${channel} send error:`, data)
            return { messageId: null, success: false }
        }

        return { messageId: data.message_id || null, success: true }
    } catch (err) {
        console.error(`Meta ${channel} send error:`, err)
        return { messageId: null, success: false }
    }
}

export async function getMetaProfile(
    senderId: string,
    channel: "facebook" | "instagram" = "facebook"
): Promise<{ firstName: string; lastName: string }> {
    if (!META_PAGE_ACCESS_TOKEN) {
        return { firstName: "Meta", lastName: senderId }
    }

    try {
        const fields = channel === "instagram" ? "name,username" : "first_name,last_name,name"
        const res = await fetch(
            `${GRAPH_API_BASE}/${senderId}?fields=${fields}&access_token=${META_PAGE_ACCESS_TOKEN}`
        )
        const data = await res.json()

        if (channel === "instagram") {
            const name = data.name || data.username || "Unknown"
            const parts = name.split(" ")
            return {
                firstName: parts[0] || "Unknown",
                lastName: parts.slice(1).join(" ") || data.username || senderId,
            }
        }

        return {
            firstName: data.first_name || data.name || "Unknown",
            lastName: data.last_name || senderId,
        }
    } catch {
        return { firstName: "Unknown", lastName: senderId }
    }
}

// ---- OAuth helpers ----

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    accessToken: string
    expiresIn: number | null
}> {
    const res = await fetch(
        `${GRAPH_API_BASE}/oauth/access_token?` +
        new URLSearchParams({
            client_id: META_APP_ID,
            client_secret: META_APP_SECRET,
            redirect_uri: redirectUri,
            code,
        })
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || "Token exchange failed")
    return { accessToken: data.access_token, expiresIn: data.expires_in || null }
}

export async function extendUserToken(shortToken: string): Promise<{
    accessToken: string
    expiresIn: number
}> {
    const res = await fetch(
        `${GRAPH_API_BASE}/oauth/access_token?` +
        new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: META_APP_ID,
            client_secret: META_APP_SECRET,
            fb_exchange_token: shortToken,
        })
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || "Token extension failed")
    return { accessToken: data.access_token, expiresIn: data.expires_in }
}

export async function getMetaUserId(accessToken: string): Promise<string> {
    const res = await fetch(
        `${GRAPH_API_BASE}/me?` + new URLSearchParams({ access_token: accessToken })
    )
    const data = await res.json()
    if (!data.id) throw new Error("Could not retrieve Meta user ID")
    return data.id
}

export async function getUserPages(userToken: string): Promise<Array<{
    pageId: string
    pageName: string
    pageAccessToken: string
    igBusinessAccountId: string | null
    igUsername: string | null
}>> {
    const res = await fetch(
        `${GRAPH_API_BASE}/me/accounts?` +
        new URLSearchParams({
            fields: "id,name,access_token,instagram_business_account{id,username}",
            access_token: userToken,
        })
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || "Failed to fetch pages")

    const pages = (data.data || []).map((page: any) => ({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        igBusinessAccountId: page.instagram_business_account?.id || null,
        igUsername: page.instagram_business_account?.username || null,
    }))

    // Fallback: if /me/accounts returns empty (common in dev mode),
    // try fetching the specific page directly using META_PAGE_ID
    if (pages.length === 0 && META_PAGE_ID) {
        try {
            const pageRes = await fetch(
                `${GRAPH_API_BASE}/${META_PAGE_ID}?` +
                new URLSearchParams({
                    fields: "id,name,access_token,instagram_business_account{id,username}",
                    access_token: userToken,
                })
            )
            const pageData = await pageRes.json()
            if (pageRes.ok && pageData.id && pageData.access_token) {
                pages.push({
                    pageId: pageData.id,
                    pageName: pageData.name || "My Page",
                    pageAccessToken: pageData.access_token,
                    igBusinessAccountId: pageData.instagram_business_account?.id || null,
                    igUsername: pageData.instagram_business_account?.username || null,
                })
            }
        } catch {
            // Ignore fallback errors
        }
    }

    return pages
}

// ---- Token-parameterized versions (for per-tenant use) ----

export async function sendMetaMessageWithToken(
    recipientId: string,
    text: string,
    pageId: string,
    pageAccessToken: string,
    channel: "facebook" | "instagram" = "facebook"
): Promise<{ messageId: string | null; success: boolean }> {
    try {
        const res = await fetch(`${GRAPH_API_BASE}/${pageId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
                messaging_type: "RESPONSE",
                access_token: pageAccessToken,
            }),
        })
        const data = await res.json()
        if (!res.ok) {
            console.error(`Meta ${channel} send error:`, data)
            return { messageId: null, success: false }
        }
        return { messageId: data.message_id || null, success: true }
    } catch (err) {
        console.error(`Meta ${channel} send error:`, err)
        return { messageId: null, success: false }
    }
}

export async function getMetaProfileWithToken(
    senderId: string,
    channel: "facebook" | "instagram",
    pageAccessToken: string
): Promise<{ firstName: string; lastName: string }> {
    try {
        const fields = channel === "instagram" ? "name,username" : "first_name,last_name,name"
        const res = await fetch(
            `${GRAPH_API_BASE}/${senderId}?` +
            new URLSearchParams({ fields, access_token: pageAccessToken })
        )
        const data = await res.json()
        if (channel === "instagram") {
            const name = data.name || data.username || "Unknown"
            const parts = name.split(" ")
            return { firstName: parts[0] || "Unknown", lastName: parts.slice(1).join(" ") || senderId }
        }
        return {
            firstName: data.first_name || data.name || "Unknown",
            lastName: data.last_name || senderId,
        }
    } catch {
        return { firstName: "Unknown", lastName: senderId }
    }
}
