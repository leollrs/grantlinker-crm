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

  // Get all googleEventIds we already know about
  const localAppointments = await db.appointment.findMany({
    where: { tenantId, googleEventId: { not: null } },
    select: { googleEventId: true },
  })
  const knownGoogleIds = new Set(localAppointments.map(a => a.googleEventId))

  // Get Google Calendar events
  const googleEvents = await getGoogleCalendarEvents()

  // Filter to only upcoming events not created by the CRM
  const now = new Date()
  const filtered = googleEvents.filter((e: any) => {
    const googleId = e.id.replace("google-", "")
    const isKnown = knownGoogleIds.has(googleId)
    const isUpcoming = new Date(e.startTime) > now
    return !isKnown && isUpcoming
  })

  return NextResponse.json(filtered)
}
