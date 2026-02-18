"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { X, Clock, User, MapPin, FileText, Calendar, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { deleteAppointment } from "@/lib/actions/appointments"
import { useRouter } from "next/navigation"

interface Appointment {
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

export function AppointmentDetailModal({
    appointment,
    onClose,
}: {
    appointment: Appointment
    onClose: () => void
}) {
    const router = useRouter()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isPending, startTransition] = useTransition()

    const start = new Date(appointment.startTime)
    const end = new Date(appointment.endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMin = Math.round(durationMs / 60000)
    const durationLabel = durationMin >= 60
        ? `${Math.floor(durationMin / 60)}h ${durationMin % 60 ? `${durationMin % 60}m` : ""}`
        : `${durationMin}m`

    const contactName = appointment.clientName || appointment.leadName
    const contactType = appointment.clientName ? "Client" : appointment.leadName ? "Lead" : null
    const contactId = appointment.clientId || appointment.leadId
    const contactHref = appointment.clientId
        ? `/dashboard/clients/${appointment.clientId}`
        : appointment.leadId
            ? `/dashboard/leads/${appointment.leadId}`
            : null

    const isGoogleOnly = appointment.id.startsWith("google-")

    function handleDelete() {
        if (isGoogleOnly) return
        startTransition(async () => {
            await deleteAppointment(appointment.id)
            onClose()
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-background border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-semibold leading-snug">{appointment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {format(start, "EEEE, MMMM d, yyyy")}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <span className={`badge ${statusBadge[appointment.status] || "badge-scheduled"}`}>
                            {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                        </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">
                                {format(start, "h:mm a")} – {format(end, "h:mm a")}
                            </p>
                            <p className="text-xs text-muted-foreground">{durationLabel}</p>
                        </div>
                    </div>

                    {/* Contact */}
                    {contactName && (
                        <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex items-center gap-2">
                                {contactHref ? (
                                    <button
                                        onClick={() => { onClose(); router.push(contactHref) }}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        {contactName}
                                    </button>
                                ) : (
                                    <p className="text-sm font-medium">{contactName}</p>
                                )}
                                {contactType && (
                                    <span className={`badge text-[10px] ${contactType === "Client" ? "badge-qualified" : "badge-contacted"}`}>
                                        {contactType}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {appointment.description && (
                        <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.description}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 flex items-center justify-between">
                    {!showDeleteConfirm ? (
                        <>
                            {isGoogleOnly ? (
                                <span className="text-xs text-muted-foreground">Google Calendar event</span>
                            ) : (
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setShowDeleteConfirm(true)}>
                                    Delete
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-muted-foreground">Delete this appointment?</p>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending} className="gap-1.5">
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Confirm
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
