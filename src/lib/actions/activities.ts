"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type ActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "STATUS_CHANGE"

export async function logActivity(
    description: string,
    type: ActivityType,
    entityIds: { leadId?: string; clientId?: string; appointmentId?: string }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).tenantId) {
        throw new Error("Unauthorized")
    }

    const tenantId = (session.user as any).tenantId
    const userId = session.user.id

    await db.activity.create({
        data: {
            description,
            type,
            tenantId,
            userId,
            ...entityIds
        }
    })
}

export async function getActivities(entityId: string, entityType: "lead" | "client") {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).tenantId) {
        return []
    }

    const tenantId = (session.user as any).tenantId

    const whereClause: any = { tenantId }
    if (entityType === "lead") whereClause.leadId = entityId
    if (entityType === "client") whereClause.clientId = entityId

    return await db.activity.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    })
}
