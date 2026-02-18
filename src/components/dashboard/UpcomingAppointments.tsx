"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentDetailModal } from "@/components/appointments/AppointmentDetailModal"
import { Clock } from "lucide-react"

interface AppointmentData {
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

export function UpcomingAppointments({ appointments }: { appointments: AppointmentData[] }) {
    const [selected, setSelected] = useState<AppointmentData | null>(null)

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Upcoming Appointments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {appointments.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments.</p>
                    ) : (
                        <div className="space-y-1">
                            {appointments.map((apt) => {
                                const start = new Date(apt.startTime)
                                const now = new Date()
                                const diffMs = start.getTime() - now.getTime()
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

                                let timeLabel = ""
                                if (diffDays > 0) timeLabel = `in ${diffDays}d`
                                else if (diffHours > 0) timeLabel = `in ${diffHours}h`
                                else timeLabel = "soon"

                                const withName = apt.clientName || apt.leadName

                                return (
                                    <div
                                        key={apt.id}
                                        onClick={() => setSelected(apt)}
                                        className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{apt.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                                {" at "}
                                                {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                {withName && <span className="text-foreground/60"> · {withName}</span>}
                                            </p>
                                        </div>
                                        <span className="badge badge-scheduled ml-4 shrink-0">
                                            {timeLabel}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
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
