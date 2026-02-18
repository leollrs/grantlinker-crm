"use client"

import { ActivityType } from "@/lib/actions/activities"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Phone, Mail, Calendar, Info } from "lucide-react"

interface Activity {
    id: string
    type: string
    description: string
    createdAt: Date
    user: {
        name: string | null
        image: string | null
    } | null
}

interface ActivityFeedProps {
    activities: Activity[]
}

const getActivityIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        CALL: <Phone className="h-3.5 w-3.5" />,
        EMAIL: <Mail className="h-3.5 w-3.5" />,
        MEETING: <Calendar className="h-3.5 w-3.5" />,
        NOTE: <MessageSquare className="h-3.5 w-3.5" />,
    }
    return iconMap[type] || <Info className="h-3.5 w-3.5" />
}

const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
        CALL: "bg-blue-50 text-blue-600",
        EMAIL: "bg-amber-50 text-amber-600",
        MEETING: "bg-violet-50 text-violet-600",
        NOTE: "bg-emerald-50 text-emerald-600",
    }
    return colorMap[type] || "bg-muted text-muted-foreground"
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return <div className="text-center text-sm text-muted-foreground py-8">No activities recorded.</div>
    }

    return (
        <ScrollArea className="h-[400px] w-full pr-4">
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={activity.user?.image || ""} alt={activity.user?.name || "User"} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {activity.user?.name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-medium truncate">{activity.user?.name}</p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center justify-center h-5 w-5 rounded ${getActivityColor(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </span>
                                <span className="text-muted-foreground">{activity.description}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
