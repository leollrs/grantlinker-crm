"use client"

import { useState, useMemo } from "react"
import { format, isToday, isTomorrow, isYesterday, startOfDay, addDays, subDays, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, User, Globe } from "lucide-react"

interface CalendarEvent {
    id: string
    title: string
    startTime: string | Date
    endTime: string | Date
    source?: "local" | "google"
    clientName?: string | null
    leadName?: string | null
}

interface MobileCalendarViewProps {
    events: CalendarEvent[]
    onDelete?: (id: string) => Promise<void>
}

type ViewMode = "today" | "week"

function formatDayLabel(date: Date): string {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "EEEE, MMM d")
}

function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
    const grouped = new Map<string, CalendarEvent[]>()
    for (const event of events) {
        const key = startOfDay(new Date(event.startTime)).toISOString()
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(event)
    }
    // Sort events within each day by start time
    for (const [, dayEvents] of grouped) {
        dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    }
    return grouped
}

export function MobileCalendarView({ events, onDelete }: MobileCalendarViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("today")
    const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()))
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const visibleEvents = useMemo(() => {
        const start = startOfDay(focusDate)
        if (viewMode === "today") {
            return events.filter(e => isSameDay(new Date(e.startTime), start))
        }
        // Week: show 7 days starting from focusDate
        const end = addDays(start, 7)
        return events.filter(e => {
            const d = new Date(e.startTime)
            return d >= start && d < end
        })
    }, [events, viewMode, focusDate])

    const grouped = useMemo(() => groupByDay(visibleEvents), [visibleEvents])

    // Sort day keys chronologically
    const sortedDays = useMemo(
        () => [...grouped.keys()].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
        [grouped]
    )

    const navigateDay = (dir: number) => {
        setFocusDate(prev => addDays(prev, dir * (viewMode === "week" ? 7 : 1)))
    }

    const goToToday = () => {
        setFocusDate(startOfDay(new Date()))
    }

    const handleDelete = async (id: string) => {
        if (!onDelete) return
        setDeletingId(id)
        try {
            await onDelete(id)
        } finally {
            setDeletingId(null)
        }
    }

    const headerLabel = viewMode === "today"
        ? formatDayLabel(focusDate)
        : `${format(focusDate, "MMM d")} – ${format(addDays(focusDate, 6), "MMM d")}`

    return (
        <div className="space-y-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setViewMode("today")}
                    className={`px-4 py-2 text-sm font-medium rounded-md min-h-[40px] transition-all duration-150 ${
                        viewMode === "today"
                            ? "bg-white dark:bg-neutral-800 shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Day
                </button>
                <button
                    onClick={() => setViewMode("week")}
                    className={`px-4 py-2 text-sm font-medium rounded-md min-h-[40px] transition-all duration-150 ${
                        viewMode === "week"
                            ? "bg-white dark:bg-neutral-800 shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Week
                </button>
            </div>

            {/* Date navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigateDay(-1)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                    <p className="text-base font-semibold">{headerLabel}</p>
                    {!isSameDay(focusDate, new Date()) && (
                        <button
                            onClick={goToToday}
                            className="text-xs text-primary font-medium mt-0.5 hover:underline"
                        >
                            Go to today
                        </button>
                    )}
                </div>
                <button
                    onClick={() => navigateDay(1)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Event list */}
            {sortedDays.length === 0 ? (
                <div className="py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No appointments {viewMode === "today" ? "today" : "this week"}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {sortedDays.map(dayKey => {
                        const dayDate = new Date(dayKey)
                        const dayEvents = grouped.get(dayKey)!
                        return (
                            <div key={dayKey}>
                                {viewMode === "week" && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${
                                            isToday(dayDate)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                            {format(dayDate, "d")}
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            isToday(dayDate) ? "text-primary" : "text-muted-foreground"
                                        }`}>
                                            {formatDayLabel(dayDate)}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {dayEvents.map(event => {
                                        const start = new Date(event.startTime)
                                        const end = new Date(event.endTime)
                                        const contactName = event.clientName || event.leadName
                                        const isGoogle = event.source === "google"

                                        return (
                                            <div
                                                key={event.id}
                                                className="group relative bg-white dark:bg-neutral-800/60 border border-border rounded-xl p-4 transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Time column */}
                                                    <div className="shrink-0 pt-0.5 text-center min-w-[48px]">
                                                        <p className="text-sm font-semibold tabular-nums">
                                                            {format(start, "h:mm")}
                                                        </p>
                                                        <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-wide">
                                                            {format(start, "a")}
                                                        </p>
                                                    </div>

                                                    {/* Accent bar */}
                                                    <div className={`w-0.5 self-stretch rounded-full shrink-0 ${
                                                        isGoogle ? "bg-blue-500" : "bg-primary"
                                                    }`} />

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm font-medium leading-snug">
                                                                {event.title}
                                                            </p>
                                                            {isGoogle && (
                                                                <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                            )}
                                                        </div>

                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {format(start, "h:mm a")} – {format(end, "h:mm a")}
                                                        </p>

                                                        {contactName && (
                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                <User className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {contactName}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`badge ${isGoogle ? "badge-scheduled" : "badge-qualified"}`}>
                                                                {isGoogle ? "Google" : "CRM"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delete action */}
                                                {onDelete && !isGoogle && (
                                                    <button
                                                        onClick={() => handleDelete(event.id)}
                                                        disabled={deletingId === event.id}
                                                        className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150 min-h-[28px] disabled:opacity-50"
                                                    >
                                                        {deletingId === event.id ? "..." : "Delete"}
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
