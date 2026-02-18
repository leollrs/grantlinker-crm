import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const tenantId = (session.user as any).tenantId

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""

    if (q.length < 1) {
        return NextResponse.json([])
    }

    // SQLite LIKE is case-insensitive for ASCII
    const pattern = `%${q}%`

    const [leads, clients] = await Promise.all([
        db.lead.findMany({
            where: {
                tenantId,
                OR: [
                    { firstName: { contains: q } },
                    { lastName: { contains: q } },
                    { email: { contains: q } },
                    { phone: { contains: q } },
                ],
            },
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
            take: 20,
        }),
        db.client.findMany({
            where: {
                tenantId,
                OR: [
                    { firstName: { contains: q } },
                    { lastName: { contains: q } },
                    { email: { contains: q } },
                    { phone: { contains: q } },
                ],
            },
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
            take: 20,
        }),
    ])

    const results = [
        ...leads.map((l) => ({ ...l, type: "lead" as const })),
        ...clients.map((c) => ({ ...c, type: "client" as const })),
    ]

    return NextResponse.json(results)
}
