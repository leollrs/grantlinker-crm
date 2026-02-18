import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ leads: 0, clients: 0, appointments: 0 })
  }

  const tenantId = (session.user as any).tenantId

  const [leadsCount, clientsCount, appointmentsCount] = await Promise.all([
    db.lead.count({
      where: { tenantId, convertedClientId: null },
    }),
    db.client.count({
      where: { tenantId },
    }),
    db.appointment.count({
      where: {
        tenantId,
        status: "SCHEDULED"
      },
    }),
  ])

  return NextResponse.json({
    leads: leadsCount,
    clients: clientsCount,
    appointments: appointmentsCount,
  })
}
