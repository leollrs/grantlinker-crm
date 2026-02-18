import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
const META_APP_ID = process.env.META_APP_ID || ""

export async function GET() {
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
    state: tenantId,
  })

  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`)
}
