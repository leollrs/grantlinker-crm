import { NextResponse } from "next/server"
import { db } from "@/lib/db"

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
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // userId
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?google=error&message=${encodeURIComponent(error)}`, baseUrl))
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard/settings?google=error&message=missing_params", baseUrl))
  }

  try {
    const redirectUri = `${baseUrl}/api/google/callback`
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })
    const tokens = await res.json()
    if (!res.ok) {
      console.error("Google token exchange failed:", tokens)
      return NextResponse.redirect(new URL("/dashboard/settings?google=error", baseUrl))
    }

    let providerAccountId = state
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (userRes.ok) {
        const userInfo = await userRes.json()
        if (userInfo?.id) {
          providerAccountId = `google-calendar:${userInfo.id}`
        }
      }
    } catch {
      // Keep a user-scoped providerAccountId fallback.
    }

    const expiresAt = tokens.expires_in
      ? Math.floor(Date.now() / 1000) + tokens.expires_in
      : null

    await db.account.upsert({
      where: {
        provider_providerAccountId: { provider: "google-calendar", providerAccountId },
      },
      create: {
        userId: state,
        type: "oauth",
        provider: "google-calendar",
        providerAccountId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
      },
      update: {
        userId: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? undefined,
        expires_at: expiresAt ?? undefined,
      },
    })

    return NextResponse.redirect(new URL("/dashboard/settings?google=connected", baseUrl))
  } catch (e) {
    console.error("Google callback error:", e)
    return NextResponse.redirect(new URL("/dashboard/settings?google=error", baseUrl))
  }
}
