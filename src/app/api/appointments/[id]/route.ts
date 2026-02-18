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

  const appointment = await db.appointment.findFirst({
    where: {
      id,
      tenantId
    },
    include: {
      client: true,
      lead: true,
      user: { select: { name: true } },
    }
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  return NextResponse.json(appointment)
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

  const existing = await db.appointment.findFirst({
    where: { id, tenantId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  try {
    const updated = await db.appointment.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        description: body.description !== undefined ? (body.description || null) : existing.description,
        startTime: body.startTime ? new Date(body.startTime) : existing.startTime,
        endTime: body.endTime ? new Date(body.endTime) : existing.endTime,
        status: body.status ?? existing.status,
        clientId: body.clientId !== undefined ? (body.clientId || null) : existing.clientId,
        leadId: body.leadId !== undefined ? (body.leadId || null) : existing.leadId,
      },
    })

    return NextResponse.json({ appointment: updated })
  } catch {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
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

  const appointment = await db.appointment.findFirst({
    where: { id, tenantId },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  await db.appointment.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
