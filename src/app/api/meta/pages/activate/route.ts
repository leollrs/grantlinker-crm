import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = (session.user as any).tenantId as string
  const body = await request.json()
  const { pageId } = body

  if (!pageId) {
    return NextResponse.json({ error: "Missing page ID" }, { status: 400 })
  }

  // Verify this page belongs to the tenant
  const page = await db.metaPage.findFirst({
    where: { pageId, tenantId },
  })
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  // Deactivate all pages for this tenant, then activate the chosen one
  await db.metaPage.updateMany({
    where: { tenantId },
    data: { isActive: false },
  })

  await db.metaPage.update({
    where: { id: page.id },
    data: { isActive: true },
  })

  return NextResponse.json({ success: true })
}
