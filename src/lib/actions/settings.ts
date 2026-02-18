"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    const name = formData.get("name") as string

    if (!name) {
        return { error: "Name is required" }
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: { name }
        })
    } catch (e) {
        return { error: "Failed to update profile" }
    }

    revalidatePath("/dashboard/settings")
    return { success: "Profile updated" }
}

export async function updateTenant(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(session.user as any).tenantId) {
        return { error: "Unauthorized" }
    }

    // Check if user is ADMIN? Schema has role.
    const user = await db.user.findUnique({
        where: { id: session.user.id }
    })

    if (user?.role !== "ADMIN") {
        return { error: "Only admins can update tenant settings" }
    }

    const name = formData.get("name") as string

    if (!name) {
        return { error: "Tenant name is required" }
    }

    try {
        await db.tenant.update({
            where: { id: (session.user as any).tenantId },
            data: { name }
        })
    } catch (e) {
        return { error: "Failed to update tenant" }
    }

    revalidatePath("/dashboard/settings")
    return { success: "Tenant updated" }
}

export async function disconnectGoogle() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await db.account.deleteMany({
            where: { userId: session.user.id, provider: "google-calendar" },
        })

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch {
        return { error: "Failed to disconnect Google Calendar" }
    }
}

export async function getSettingsData() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { tenant: true, accounts: true }
    })

    return user
}
