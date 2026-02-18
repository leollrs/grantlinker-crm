import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json([])
  }

  const tenantId = (session.user as any).tenantId
  const { searchParams } = new URL(request.url)
  const includeArchived = searchParams.get("archived") === "true"

  const conversations = await db.conversation.findMany({
    where: {
      tenantId,
      status: includeArchived ? undefined : "active",
    },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  })

  return NextResponse.json(conversations)
}
