"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function activateMetaPage(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { error: "Unauthorized" }

    const tenantId = (session.user as any).tenantId as string
    const pageId = formData.get("pageId") as string

    if (!pageId) return { error: "Missing page ID" }

    // Verify this page belongs to the tenant
    const page = await db.metaPage.findFirst({
        where: { pageId, tenantId },
    })
    if (!page) return { error: "Page not found" }

    // Deactivate all pages for this tenant, then activate the chosen one
    await db.metaPage.updateMany({
        where: { tenantId },
        data: { isActive: false },
    })

    await db.metaPage.update({
        where: { pageId },
        data: { isActive: true },
    })

    revalidatePath("/dashboard/settings")
    redirect("/dashboard/settings?meta=connected")
}

export async function disconnectMeta() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { error: "Unauthorized" }

    const tenantId = (session.user as any).tenantId as string

    await db.metaPage.deleteMany({ where: { tenantId } })
    await db.metaAccount.deleteMany({ where: { tenantId } })

    revalidatePath("/dashboard/settings")
    redirect("/dashboard/settings?meta=disconnected")
}

export async function getMetaConnectionStatus(tenantId: string) {
    return db.metaPage.findFirst({
        where: { tenantId, isActive: true },
        select: { pageId: true, pageName: true, igUsername: true },
    })
}
