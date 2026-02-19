import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

const META_APP_ID = process.env.META_APP_ID || ""

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

  const tenantId = (session.user as { tenantId?: string }).tenantId
  if (!tenantId) {
    return NextResponse.redirect(new URL("/dashboard/settings?meta=error", baseUrl))
  }

  const redirectUri = `${baseUrl}/api/meta/callback`
  const scope = "pages_show_list,pages_messaging,instagram_manage_messages,business_management"
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: redirectUri,
    scope,
    state: `${tenantId}:${session.user.id}`,
  })

  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`)
}
