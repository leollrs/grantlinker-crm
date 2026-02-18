import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  exchangeCodeForToken,
  extendUserToken,
  getMetaUserId,
  getUserPages,
} from "@/lib/meta"

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId
  if (!tenantId) {
    return NextResponse.redirect(new URL("/dashboard/settings?meta=error", baseUrl))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?meta=error&message=${encodeURIComponent(error)}`, baseUrl)
    )
  }
  if (!code || state !== tenantId) {
    return NextResponse.redirect(new URL("/dashboard/settings?meta=error&message=invalid_state", baseUrl))
  }

  try {
    const redirectUri = `${baseUrl}/api/meta/callback`
    console.log("[Meta Callback] Starting OAuth flow", { tenantId, redirectUri })
    
    const { accessToken, expiresIn } = await exchangeCodeForToken(code, redirectUri)
    console.log("[Meta Callback] Token exchanged", { hasAccessToken: !!accessToken })
    
    const longLived = await extendUserToken(accessToken)
    console.log("[Meta Callback] Token extended", { hasLongLivedToken: !!longLived.accessToken })
    
    const metaUserId = await getMetaUserId(longLived.accessToken)
    console.log("[Meta Callback] Got Meta user ID", { metaUserId })
    
    const pages = await getUserPages(longLived.accessToken)
    console.log("[Meta Callback] Got pages", { pageCount: pages.length, pages: pages.map(p => p.pageName) })

    const tokenExpiry = longLived.expiresIn
      ? new Date(Date.now() + longLived.expiresIn * 1000)
      : null

    const account = await db.metaAccount.upsert({
      where: { tenantId },
      create: {
        tenantId,
        metaUserId,
        accessToken: longLived.accessToken,
        tokenExpiry,
        scopes: "pages_show_list,pages_messaging,instagram_manage_messages,business_management",
      },
      update: {
        metaUserId,
        accessToken: longLived.accessToken,
        tokenExpiry,
      },
    })

    if (pages.length > 0) {
      const createdPages = []
      for (const p of pages) {
        const page = await db.metaPage.upsert({
          where: { pageId: p.pageId },
          create: {
            tenantId,
            metaAccountId: account.id,
            pageId: p.pageId,
            pageName: p.pageName,
            pageAccessToken: p.pageAccessToken,
            igBusinessAccountId: p.igBusinessAccountId,
            igUsername: p.igUsername,
            isActive: false,
          },
          update: {
            pageName: p.pageName,
            pageAccessToken: p.pageAccessToken,
            igBusinessAccountId: p.igBusinessAccountId,
            igUsername: p.igUsername,
          },
        })
        createdPages.push(page)
      }

      // If only one page, auto-activate it
      if (createdPages.length === 1) {
        await db.metaPage.update({
          where: { pageId: createdPages[0].pageId },
          data: { isActive: true },
        })
        revalidatePath("/dashboard/settings")
        return NextResponse.redirect(new URL("/dashboard/settings?meta=connected", baseUrl))
      }

      // Multiple pages - redirect to selection page with accountId
      revalidatePath("/dashboard/settings")
      return NextResponse.redirect(new URL(`/dashboard/settings/meta-pages?accountId=${account.id}`, baseUrl))
    }

    // No pages found - still save the account but show a message
    revalidatePath("/dashboard/settings")
    return NextResponse.redirect(new URL("/dashboard/settings?meta=connected&no_pages=true", baseUrl))
  } catch (e) {
    console.error("Meta callback error:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    console.error("Error details:", {
      message: errorMessage,
      code,
      state,
      tenantId,
      hasSession: !!session,
    })
    return NextResponse.redirect(
      new URL(`/dashboard/settings?meta=error&message=${encodeURIComponent(errorMessage)}`, baseUrl)
    )
  }
}
