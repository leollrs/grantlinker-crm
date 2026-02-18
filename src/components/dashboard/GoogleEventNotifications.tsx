"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AppointmentDetailModal } from "@/components/appointments/AppointmentDetailModal"
import { Bell, X, Eye } from "lucide-react"

interface GoogleEvent {
    id: string
    title: string
    startTime: string | Date
    endTime?: string | Date
}

interface ModalData {
    id: string
    title: string
    description: string | null
    startTime: string
    endTime: string
    status: string
    clientName: string | null
    clientId: string | null
    leadName: string | null
    leadId: string | null
}

export function GoogleEventNotifications({ events }: { events: GoogleEvent[] }) {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
    const [allDismissed, setAllDismissed] = useState(false)
    const [selected, setSelected] = useState<ModalData | null>(null)

    if (allDismissed) return null

    const visibleEvents = events.filter(e => !dismissedIds.has(e.id))
    if (visibleEvents.length === 0) return null

    const dismissOne = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]))
    }

    const dismissAll = () => {
        setAllDismissed(true)
    }

    function openEvent(event: GoogleEvent) {
        const start = new Date(event.startTime)
        const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 60 * 60 * 1000)
        setSelected({
            id: event.id,
            title: event.title,
            description: null,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: "SCHEDULED",
            clientName: null,
            clientId: null,
            leadName: null,
            leadId: null,
        })
    }

    return (
        <>
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                                <Bell className="h-3.5 w-3.5 text-primary" />
                            </div>
                            New Google Calendar Events
                        </div>
                        <button
                            onClick={dismissAll}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-primary/10 transition-colors duration-150"
                        >
                            <Eye className="h-3 w-3" />
                            Mark all as seen
                        </button>
                    </div>
                    <div className="space-y-1">
                        {visibleEvents.map((event) => {
                            const start = new Date(event.startTime)
                            return (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-primary/5 transition-colors duration-150 cursor-pointer"
                                    onClick={() => openEvent(event)}
                                >
                                    <div>
                                        <p className="font-medium text-sm">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                            {" at "}
                                            {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); dismissOne(event.id) }}
                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors duration-150"
                                        title="Dismiss"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {selected && (
                <AppointmentDetailModal
                    appointment={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    )
}
