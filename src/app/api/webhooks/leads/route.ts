
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get("x-api-key")
        if (!apiKey) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // simplistic auth: apiKey = tenantId for this demo
        // In production, you'd map API keys to tenants in DB
        const tenant = await db.tenant.findUnique({
            where: { id: apiKey }
        })

        if (!tenant) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401 })
        }

        const body = await req.json()
        const { firstName, lastName, email, source } = body

        if (!firstName || !lastName || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const lead = await db.lead.create({
            data: {
                firstName,
                lastName,
                email,
                source: source || "webhook",
                tenantId: tenant.id
            }
        })

        return NextResponse.json(lead, { status: 201 })
    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
