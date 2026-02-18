import { createHmac } from "crypto"

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret"
const TTL_SECONDS = 600 // 10 minutes

interface StatePayload {
    tenantId: string
    userId: string
    ts: number
}

export function createOAuthState(tenantId: string, userId: string): string {
    const payload: StatePayload = { tenantId, userId, ts: Math.floor(Date.now() / 1000) }
    const json = JSON.stringify(payload)
    const encoded = Buffer.from(json).toString("base64url")
    const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url")
    return `${encoded}.${sig}`
}

export function verifyOAuthState(state: string): StatePayload | null {
    const [encoded, sig] = state.split(".")
    if (!encoded || !sig) return null

    const expected = createHmac("sha256", SECRET).update(encoded).digest("base64url")
    if (expected !== sig) return null

    try {
        const payload: StatePayload = JSON.parse(Buffer.from(encoded, "base64url").toString())
        const age = Math.floor(Date.now() / 1000) - payload.ts
        if (age > TTL_SECONDS) return null
        return payload
    } catch {
        return null
    }
}
