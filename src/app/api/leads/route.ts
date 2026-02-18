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

  const leads = await db.lead.findMany({
    where: {
      tenantId,
      convertedClientId: null,
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return NextResponse.json(leads)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = (session.user as any).tenantId
  const body = await request.json()

  const { firstName, lastName, email, status = "NEW", phone, address, companyName } = body

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  try {
    const lead = await db.lead.create({
      data: {
        firstName,
        lastName,
        email,
        status,
        phone: phone || null,
        address: address || null,
        companyName: companyName || null,
        tenantId
      }
    })

    return NextResponse.json({ lead })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
