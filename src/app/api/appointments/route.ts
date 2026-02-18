import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGoogleCalendarEvents } from "@/lib/actions/appointments"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json([])
  }

  const tenantId = (session.user as any).tenantId

  const appointments = await db.appointment.findMany({
    where: {
      tenantId
    },
    include: {
      client: true,
      lead: true,
      user: { select: { name: true } },
    },
    orderBy: {
      startTime: "asc"
    }
  })

  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = (session.user as any).tenantId
  const userId = session.user.id
  const body = await request.json()

  const { title, description, startTime, endTime, clientId, leadId } = body

  if (!title || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const appointment = await db.appointment.create({
      data: {
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        clientId: clientId || null,
        leadId: leadId || null,
        userId,
        tenantId,
        status: "SCHEDULED"
      }
    })

    return NextResponse.json({ appointment })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
