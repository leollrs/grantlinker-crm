import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json([])
  }

  const tenantId = (session.user as any).tenantId

  const appointments = await db.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: new Date() },
      status: "SCHEDULED",
    },
    include: {
      client: true,
      lead: true,
    },
    orderBy: { startTime: "asc" },
    take: 5,
  })

  return NextResponse.json(appointments)
}
