"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const companyName = formData.get("companyName") as string

    if (!name || !email || !password || !companyName) {
        return { error: "All fields are required" }
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters" }
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
        return { error: "An account with this email already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

    // Check for slug collision
    const existingTenant = await db.tenant.findUnique({ where: { slug } })
    const finalSlug = existingTenant ? `${slug}-${Date.now()}` : slug

    const tenant = await db.tenant.create({
        data: {
            name: companyName,
            slug: finalSlug,
        },
    })

    await db.user.create({
        data: {
            name,
            email,
            hashedPassword,
            role: "ADMIN",
            tenantId: tenant.id,
        },
    })

    return { success: true }
}
