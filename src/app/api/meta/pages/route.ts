import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = (session.user as any).tenantId as string
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get("accountId")

  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 })
  }

  const pages = await db.metaPage.findMany({
    where: { metaAccountId: accountId, tenantId, isActive: false },
  })

  return NextResponse.json(pages)
}
