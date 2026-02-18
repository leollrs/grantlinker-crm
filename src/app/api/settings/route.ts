import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMetaConnectionStatus } from "@/lib/actions/meta"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenant: true,
      accounts: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const metaPage = await getMetaConnectionStatus(user.tenantId)

  return NextResponse.json({
    ...user,
    metaPage,
  })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  if (body.name) {
    await db.user.update({
      where: { id: session.user.id },
      data: { name: body.name }
    })
  }

  if (body.tenantName && (session.user as any).tenantId) {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role === "ADMIN") {
      await db.tenant.update({
        where: { id: (session.user as any).tenantId },
        data: { name: body.tenantName }
      })
    }
  }

  return NextResponse.json({ success: true })
}
