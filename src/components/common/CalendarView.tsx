"use client"

import { Calendar, dateFnsLocalizer, type View, type NavigateAction } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar as CalendarIcon } from 'lucide-react'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface CalendarEvent {
    id: string
    title: string
    startTime: string | Date
    endTime: string | Date
    source?: "local" | "google"
}

interface MappedEvent {
    id: string
    title: string
    start: Date
    end: Date
    source: string
}

interface CalendarViewProps {
    appointments: CalendarEvent[]
    onDelete?: (id: string) => Promise<void>
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])
    return isMobile
}

export function CalendarView({ appointments, onDelete }: CalendarViewProps) {
    const isMobile = useIsMobile()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentView, setCurrentView] = useState<View>("day")
    const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Set appropriate default view once we know the screen size
    useEffect(() => {
        setCurrentView(isMobile ? "day" : "month")
    }, [isMobile])

    const events: MappedEvent[] = appointments.map(apt => ({
        id: apt.id,
        title: apt.title,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        source: apt.source || "local",
    }))

    const handleNavigate = useCallback((newDate: Date, view: View, action: NavigateAction) => {
        setCurrentDate(newDate)
    }, [])

    const handleViewChange = useCallback((view: View) => {
        setCurrentView(view)
    }, [])

    const handleSelectEvent = useCallback((event: MappedEvent) => {
        setSelectedEvent(event)
    }, [])

    const handleDelete = async () => {
        if (!selectedEvent || !onDelete) return
        setDeleting(true)
        try {
            await onDelete(selectedEvent.id)
            setSelectedEvent(null)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="relative">
            <style>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-toolbar button {
                    padding: 6px 12px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: var(--background);
                    color: var(--foreground);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    margin: 0 2px;
                    transition: all 150ms;
                    min-height: 36px;
                }
                @media (max-width: 767px) {
                    .rbc-toolbar button {
                        min-height: 44px;
                        padding: 8px 14px;
                        font-size: 14px;
                    }
                }
                .rbc-toolbar button:hover {
                    background: var(--accent);
                }
                .rbc-toolbar button.rbc-active {
                    background: var(--primary);
                    color: var(--primary-foreground);
                    border-color: var(--primary);
                }
                .rbc-toolbar {
                    margin-bottom: 16px;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 0;
                }
                @media (max-width: 767px) {
                    .rbc-toolbar {
                        justify-content: center;
                        gap: 6px;
                    }
                    .rbc-toolbar-label {
                        width: 100%;
                        text-align: center;
                        order: -1;
                    }
                }
                .rbc-toolbar-label {
                    font-weight: 600;
                    font-size: 16px;
                }
                .rbc-header {
                    font-weight: 500;
                    font-size: 12px;
                    color: var(--muted-foreground);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 8px 4px !important;
                    border-bottom: 1px solid var(--border) !important;
                }
                .rbc-off-range-bg { background: var(--muted) !important; }
                .rbc-today { background: var(--accent) !important; }
                .rbc-event {
                    border-radius: 6px;
                    font-size: 12px;
                    padding: 2px 6px;
                    cursor: pointer;
                    border: none !important;
                    transition: opacity 150ms;
                }
                @media (max-width: 767px) {
                    .rbc-event {
                        padding: 4px 8px;
                        font-size: 13px;
                        min-height: 28px;
                        display: flex;
                        align-items: center;
                    }
                }
                .rbc-event:hover { opacity: 0.85; }
                .rbc-event.google-event {
                    background-color: #4285f4;
                }
                .rbc-day-bg + .rbc-day-bg,
                .rbc-month-row + .rbc-month-row {
                    border-color: var(--border) !important;
                }
                .rbc-month-view, .rbc-time-view {
                    border: 1px solid var(--border) !important;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .rbc-time-content {
                    border-top: 1px solid var(--border) !important;
                }
                .rbc-time-slot {
                    min-height: 28px;
                }
                @media (max-width: 767px) {
                    .rbc-time-slot { min-height: 36px; }
                    .rbc-label { font-size: 11px; }
                }
            `}</style>

            {selectedEvent && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSelectedEvent(null)}
                >
                    {/* Full-screen bottom sheet on mobile, centered modal on desktop */}
                    <div
                        className="bg-background w-full md:max-w-[420px] md:rounded-2xl rounded-t-2xl md:m-4 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag handle on mobile */}
                        <div className="flex justify-center pt-3 md:hidden">
                            <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
                        </div>

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                                    <span className={`badge mt-1 ${
                                        selectedEvent.source === "google" ? "badge-scheduled" : "badge-qualified"
                                    }`}>
                                        {selectedEvent.source === "google" ? "Google Calendar" : "CRM"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-2 -mr-2 rounded-lg hover:bg-accent transition-colors duration-150"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Start</span>
                                    <p className="font-medium mt-0.5">{format(selectedEvent.start, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">End</span>
                                    <p className="font-medium mt-0.5">{format(selectedEvent.end, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                {onDelete && (
                                    <button
                                        className="flex-1 px-4 py-3 bg-destructive text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? "Deleting..." : "Delete"}
                                    </button>
                                )}
                                <button
                                    className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all duration-150 min-h-[44px]"
                                    onClick={() => setSelectedEvent(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Safe area padding on mobile */}
                        <div className="h-[env(safe-area-inset-bottom)] md:hidden" />
                    </div>
                </div>,
                document.body
            )}

            <div className="h-[480px] md:h-[600px]">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={isMobile ? ['day', 'week'] : ['month', 'week', 'day']}
                    view={isMobile && currentView === 'month' ? 'day' : currentView}
                    date={currentDate}
                    onNavigate={handleNavigate}
                    onView={handleViewChange}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={(event: any) => {
                        if (event.source === "google") {
                            return { className: "google-event" }
                        }
                        return {}
                    }}
                />
            </div>
        </div>
    )
}
