import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const tenantId = (session.user as any).tenantId

  const client = await db.client.findFirst({
    where: {
      id,
      tenantId
    },
    include: {
      appointments: true,
      activities: true,
      conversations: { select: { channel: true } },
    }
  })

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const tenantId = (session.user as any).tenantId
  const body = await request.json()

  const existing = await db.client.findFirst({
    where: { id, tenantId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  try {
    const updated = await db.client.update({
      where: { id },
      data: {
        firstName: body.firstName ?? existing.firstName,
        lastName: body.lastName ?? existing.lastName,
        email: body.email ?? existing.email,
        phone: body.phone !== undefined ? (body.phone || null) : existing.phone,
        address: body.address !== undefined ? (body.address || null) : existing.address,
      },
    })

    return NextResponse.json({ client: updated })
  } catch {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const tenantId = (session.user as any).tenantId

  const client = await db.client.findUnique({
    where: { id, tenantId }
  })

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  await db.client.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
