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

  const lead = await db.lead.findFirst({
    where: {
      id,
      tenantId
    },
    include: {
      activities: true,
      appointments: true,
      conversations: { select: { channel: true } },
      convertedClient: {
        include: { appointments: true }
      },
    }
  })

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  return NextResponse.json(lead)
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

  const existing = await db.lead.findFirst({
    where: { id, tenantId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  try {
    const updated = await db.lead.update({
      where: { id },
      data: {
        firstName: body.firstName ?? existing.firstName,
        lastName: body.lastName ?? existing.lastName,
        email: body.email ?? existing.email,
        phone: body.phone !== undefined ? (body.phone || null) : existing.phone,
        address: body.address !== undefined ? (body.address || null) : existing.address,
        companyName: body.companyName !== undefined ? (body.companyName || null) : existing.companyName,
        status: body.status ?? existing.status,
        value: body.value !== undefined ? body.value : existing.value,
      },
    })

    return NextResponse.json({ lead: updated })
  } catch {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
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

  const lead = await db.lead.findUnique({
    where: { id, tenantId }
  })

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  await db.lead.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
