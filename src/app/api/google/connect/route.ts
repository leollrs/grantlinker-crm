import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

function getBaseUrl(request: Request) {
    const url = new URL(request.url)
    const forwardedHost = request.headers.get("x-forwarded-host")
    const forwardedProto = request.headers.get("x-forwarded-proto")

    if (forwardedHost) {
        const proto = forwardedProto || url.protocol.replace(":", "")
        return `${proto}://${forwardedHost}`
    }

    return url.origin
}

export async function GET(request: Request) {
    const baseUrl = getBaseUrl(request)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/login", baseUrl))
    }

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        redirect_uri: `${baseUrl}/api/google/callback`,
        response_type: "code",
        scope: "openid email profile https://www.googleapis.com/auth/calendar",
        access_type: "offline",
        prompt: "consent",
        state: session.user.id,
    })

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
