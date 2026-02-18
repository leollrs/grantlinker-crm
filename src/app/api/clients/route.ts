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

  const clients = await db.client.findMany({
    where: {
      tenantId
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = (session.user as any).tenantId
  const body = await request.json()

  const { firstName, lastName, email, phone, address } = body

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  try {
    const client = await db.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        tenantId
      }
    })

    return NextResponse.json({ client })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
