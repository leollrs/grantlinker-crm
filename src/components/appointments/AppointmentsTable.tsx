"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentDetailModal } from "./AppointmentDetailModal"
import { format } from "date-fns"

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

const statusBadge: Record<string, string> = {
    SCHEDULED: "badge-scheduled",
    COMPLETED: "badge-completed",
    CANCELLED: "badge-cancelled",
}

export function AppointmentsTable({ appointments }: { appointments: AppointmentData[] }) {
    const [selected, setSelected] = useState<AppointmentData | null>(null)

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Appointments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {appointments.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-6 pt-0 text-center">No appointments scheduled.</p>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="h-11 px-4 text-left font-medium text-muted-foreground">Title</th>
                                        <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                                        <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Time</th>
                                        <th className="h-11 px-4 text-left font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(apt => {
                                        const start = new Date(apt.startTime)
                                        const end = new Date(apt.endTime)
                                        return (
                                            <tr
                                                key={apt.id}
                                                onClick={() => setSelected(apt)}
                                                className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150 cursor-pointer"
                                            >
                                                <td className="px-4 py-3 font-medium">{apt.title}</td>
                                                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                                                    {format(start, "MMM d, yyyy")}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                    {format(start, "h:mm a")} – {format(end, "h:mm a")}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`badge ${statusBadge[apt.status] || "badge-scheduled"}`}>
                                                        {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
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
