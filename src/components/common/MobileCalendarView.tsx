"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, type NavigateAction, type ViewProps, type ViewStatic } from "react-big-calendar"
import TimeGrid from "react-big-calendar/lib/TimeGrid"
import type { CalendarProps, TimeGridProps } from "react-big-calendar"
import type { ComponentType, ReactElement } from "react"
import {
  addDays,
  addMonths,
  format,
  getDay,
  isSameDay,
  isToday,
  parse,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { enUS } from "date-fns/locale"
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Filter, User, Users, X } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  startTime: string | Date
  endTime: string | Date
  source?: "local" | "google"
  clientName?: string | null
  leadName?: string | null
  userName?: string | null
}

interface MappedCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  source: "local" | "google"
  clientName?: string | null
  leadName?: string | null
  userName?: string | null
}

interface MobileCalendarViewProps {
  events: CalendarEvent[]
  onDelete?: (id: string) => Promise<void>
}

type CalendarViewMode = "day" | "threeDay" | "week" | "month"
type CalendarViewMap = Record<string, boolean | (ComponentType<ViewProps> & ViewStatic)>
type MobileCalendarProps = Omit<CalendarProps<MappedCalendarEvent, object>, "view" | "views" | "onView"> & {
  view: CalendarViewMode
  views: CalendarViewMap
  onView?: (view: CalendarViewMode) => void
}
type ThreeDayViewComponent = ((props: ViewProps) => ReactElement) &
  ViewStatic & {
    range: (date: Date) => Date[]
  }

const VIEW_STORAGE_KEY = "crm:mobile-calendar-view"

const VIEW_OPTIONS: Array<{ label: string; value: CalendarViewMode }> = [
  { label: "Day", value: "day" },
  { label: "3-Day", value: "threeDay" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
]

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const CustomCalendar = Calendar as unknown as ComponentType<MobileCalendarProps>

const ThreeDayView = ((props: ViewProps) => {
  const timeGridProps = props as unknown as TimeGridProps
  const start = startOfDay(props.date)
  const range = [start, addDays(start, 1), addDays(start, 2)]
  return <TimeGrid {...timeGridProps} range={range} eventOffset={15} />
}) as unknown as ThreeDayViewComponent

ThreeDayView.range = (date: Date) => {
  const start = startOfDay(date)
  return [start, addDays(start, 1), addDays(start, 2)]
}

ThreeDayView.navigate = (date: Date, action: NavigateAction) => {
  if (action === "PREV") return addDays(date, -3)
  if (action === "NEXT") return addDays(date, 3)
  if (action === "TODAY") return new Date()
  return date
}

ThreeDayView.title = (date: Date) => {
  const start = startOfDay(date)
  const end = addDays(start, 2)
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
}

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Today"
  return format(date, "EEEE, MMM d")
}

function getRangeLabel(viewMode: CalendarViewMode, focusDate: Date): string {
  if (viewMode === "day") return formatDayLabel(focusDate)
  if (viewMode === "threeDay") {
    return `${format(focusDate, "MMM d")} - ${format(addDays(focusDate, 2), "MMM d")}`
  }
  if (viewMode === "week") {
    const start = startOfWeek(focusDate, { weekStartsOn: 0 })
    return `${format(start, "MMM d")} - ${format(addDays(start, 6), "MMM d")}`
  }
  return format(focusDate, "MMMM yyyy")
}

export function MobileCalendarView({ events, onDelete }: MobileCalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day")
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()))
  const [selectedEvent, setSelectedEvent] = useState<MappedCalendarEvent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [appliedStaffFilters, setAppliedStaffFilters] = useState<string[]>([])
  const [appliedServiceFilters, setAppliedServiceFilters] = useState<string[]>([])
  const [pendingStaffFilters, setPendingStaffFilters] = useState<string[]>([])
  const [pendingServiceFilters, setPendingServiceFilters] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (!saved) return
    const next = VIEW_OPTIONS.find((option) => option.value === saved)
    if (next) setViewMode(next.value)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode)
  }, [viewMode])

  const staffOptions = useMemo(
    () =>
      [...new Set(events.map((event) => event.userName?.trim()).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b)
      ),
    [events]
  )

  const hasStaffSupport = useMemo(
    () => events.some((event) => Object.prototype.hasOwnProperty.call(event, "userName")),
    [events]
  )

  const serviceOptions = useMemo(
    () =>
      [
        ...new Set(
          events
            .filter((event) => event.source !== "google")
            .map((event) => event.title.trim())
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [events]
  )

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (appliedStaffFilters.length > 0) {
          if (!event.userName || !appliedStaffFilters.includes(event.userName)) return false
        }
        if (appliedServiceFilters.length > 0) {
          if (event.source === "google") return false
          if (!appliedServiceFilters.includes(event.title.trim())) return false
        }
        return true
      }),
    [events, appliedServiceFilters, appliedStaffFilters]
  )

  const calendarEvents = useMemo<MappedCalendarEvent[]>(
    () =>
      filteredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        source: event.source || "local",
        clientName: event.clientName,
        leadName: event.leadName,
        userName: event.userName,
      })),
    [filteredEvents]
  )

  const selectedDayEvents = useMemo(
    () => calendarEvents.filter((event) => isSameDay(event.start, focusDate)),
    [calendarEvents, focusDate]
  )

  const stripDays = useMemo(() => {
    if (viewMode === "month") return []
    if (viewMode === "day") return [focusDate]
    if (viewMode === "threeDay") return [focusDate, addDays(focusDate, 1), addDays(focusDate, 2)]

    const stripStart = startOfWeek(focusDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, idx) => addDays(stripStart, idx))
  }, [focusDate, viewMode])

  const currentViewLabel = VIEW_OPTIONS.find((option) => option.value === viewMode)?.label || "Day"
  const rangeLabel = getRangeLabel(viewMode, focusDate)
  const activeFilterCount = appliedStaffFilters.length + appliedServiceFilters.length
  const hasStaffQuickSelector = hasStaffSupport && staffOptions.length > 0

  const calendarViews = useMemo<CalendarViewMap>(
    () => ({
      day: true,
      week: true,
      month: true,
      threeDay: ThreeDayView,
    }),
    []
  )

  const navigateRange = (direction: number) => {
    setFocusDate((previous) => {
      if (viewMode === "day") return addDays(previous, direction)
      if (viewMode === "threeDay") return addDays(previous, direction * 3)
      if (viewMode === "week") return addDays(previous, direction * 7)
      return addMonths(previous, direction)
    })
  }

  const goToToday = () => {
    setFocusDate(startOfDay(new Date()))
  }

  const openFilterSheet = () => {
    setPendingStaffFilters(appliedStaffFilters)
    setPendingServiceFilters(appliedServiceFilters)
    setIsFilterSheetOpen(true)
  }

  const applyFilters = () => {
    setAppliedStaffFilters(pendingStaffFilters)
    setAppliedServiceFilters(pendingServiceFilters)
    setIsFilterSheetOpen(false)
  }

  const clearPendingFilters = () => {
    setPendingStaffFilters([])
    setPendingServiceFilters([])
  }

  const clearAppliedFilters = () => {
    setAppliedStaffFilters([])
    setAppliedServiceFilters([])
    setPendingStaffFilters([])
    setPendingServiceFilters([])
  }

  const toggleMultiValue = (current: string[], nextValue: string) => {
    if (current.includes(nextValue)) return current.filter((value) => value !== nextValue)
    return [...current, nextValue]
  }

  const handleDelete = async (id: string) => {
    if (!onDelete) return
    setDeletingId(id)
    try {
      await onDelete(id)
      setSelectedEvent(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5 pb-5">
      <style>{`
        .mobile-rbc .rbc-toolbar { display: none; }
        .mobile-rbc .rbc-time-header-content,
        .mobile-rbc .rbc-row-content,
        .mobile-rbc .rbc-month-row,
        .mobile-rbc .rbc-day-bg + .rbc-day-bg,
        .mobile-rbc .rbc-time-view,
        .mobile-rbc .rbc-month-view,
        .mobile-rbc .rbc-time-content,
        .mobile-rbc .rbc-timeslot-group {
          border-color: var(--border);
        }
        .mobile-rbc .rbc-time-view,
        .mobile-rbc .rbc-month-view {
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        .mobile-rbc .rbc-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--muted-foreground);
          font-weight: 600;
          padding: 8px 2px;
        }
        .mobile-rbc .rbc-today { background-color: color-mix(in oklab, var(--primary) 10%, transparent); }
        .mobile-rbc .rbc-time-slot { min-height: 34px; }
        .mobile-rbc .rbc-label { font-size: 11px; color: var(--muted-foreground); }
        .mobile-rbc .rbc-event {
          border: none;
          border-radius: 8px;
          font-size: 12px;
          padding: 2px 6px;
          background: var(--primary);
          color: var(--primary-foreground);
        }
        .mobile-rbc .mobile-google-event {
          background: #4285f4;
          color: #fff;
        }
        .mobile-day-pill-active {
          background: linear-gradient(180deg, #2563eb, #1e40af);
          color: #fff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.24);
        }
        .mobile-rbc .rbc-agenda-view table.rbc-agenda-table { border-color: var(--border); }
        .mobile-rbc.mobile-rbc--hide-table-dates .rbc-time-header {
          display: none;
        }
        .mobile-rbc.mobile-rbc--hide-table-dates .rbc-time-content {
          border-top: 0;
        }
      `}</style>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsViewSheetOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 bg-white px-3.5 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:bg-accent transition-colors duration-150"
        >
          <span>{currentViewLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={openFilterSheet}
          className="h-10 w-10 rounded-xl border border-black/5 bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:bg-accent transition-colors duration-150"
          aria-label="Open filters"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateRange(-1)}
          className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous range"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-center">{rangeLabel}</p>
        <button
          type="button"
          onClick={() => navigateRange(1)}
          className="p-2 rounded-lg hover:bg-accent transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Next range"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {viewMode !== "month" && (
        <div
          className="grid gap-1 rounded-2xl border border-black/5 bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          style={{ gridTemplateColumns: `repeat(${stripDays.length}, minmax(0, 1fr))` }}
        >
          {stripDays.map((day) => {
            const selected = isSameDay(day, focusDate)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setFocusDate(startOfDay(day))}
                className={`rounded-lg px-1.5 py-2 text-center transition-colors duration-150 ${
                  selected ? "mobile-day-pill-active" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {viewMode === "week" ? (
                  <>
                    <p className="text-[10px] font-semibold uppercase leading-none">{format(day, "EEEEE")}</p>
                    <p className="text-sm font-semibold mt-1 leading-none">{format(day, "d")}</p>
                  </>
                ) : (
                  <p className="text-xs font-semibold leading-none uppercase">{format(day, "EEE d")}</p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-3.5 py-2.5 shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
          <p className="text-xs text-muted-foreground">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
          </p>
          <button type="button" onClick={clearAppliedFilters} className="text-xs font-medium text-primary">
            Clear all
          </button>
        </div>
      )}

      <div className={`mobile-rbc h-[420px] ${viewMode !== "month" ? "mobile-rbc--hide-table-dates" : ""}`}>
        <CustomCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          date={focusDate}
          view={viewMode}
          views={calendarViews}
          onView={(nextView) => setViewMode(nextView as CalendarViewMode)}
          onNavigate={(nextDate) => setFocusDate(startOfDay(nextDate))}
          onSelectEvent={(event) => setSelectedEvent(event as MappedCalendarEvent)}
          eventPropGetter={(event: MappedCalendarEvent) =>
            event.source === "google" ? { className: "mobile-google-event" } : {}
          }
          popup
        />
      </div>

      {viewMode === "day" && selectedDayEvents.length === 0 && (
        <div className="py-10 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">No appointments for this day</p>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity duration-150"
          >
            + Add appointment
          </Link>
        </div>
      )}

      {!isToday(focusDate) && (
        <button
          type="button"
          onClick={goToToday}
          className="fixed md:hidden right-4 z-30 rounded-full border border-black/5 bg-white px-3.5 py-2.5 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-foreground hover:bg-accent transition-colors duration-150"
          style={{
            bottom: hasStaffQuickSelector
              ? "calc(env(safe-area-inset-bottom) + 9.75rem)"
              : "calc(env(safe-area-inset-bottom) + 6.25rem)",
          }}
        >
          Today
        </button>
      )}

      {hasStaffQuickSelector && (
        <button
          type="button"
          onClick={openFilterSheet}
          className="fixed md:hidden right-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-2.5 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-foreground hover:bg-accent transition-colors duration-150"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 6.25rem)" }}
          aria-label="Open staff selector"
        >
          <Users className="h-3.5 w-3.5" />
          Staff
        </button>
      )}

      {selectedEvent && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40"
            onClick={() => setSelectedEvent(null)}
            aria-label="Close appointment details"
          />
          <div className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-black/5 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold">{selectedEvent.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(selectedEvent.start, "EEE, MMM d h:mm a")} - {format(selectedEvent.end, "h:mm a")}
                </p>
                {(selectedEvent.clientName || selectedEvent.leadName) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{selectedEvent.clientName || selectedEvent.leadName}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors duration-150"
                aria-label="Close appointment details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {onDelete && selectedEvent.source !== "google" && (
              <button
                type="button"
                onClick={() => handleDelete(selectedEvent.id)}
                disabled={deletingId === selectedEvent.id}
                className="mt-4 w-full rounded-lg bg-destructive text-white px-3 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {deletingId === selectedEvent.id ? "Deleting..." : "Delete appointment"}
              </button>
            )}
          </div>
        </>
      )}

      {isViewSheetOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40"
            onClick={() => setIsViewSheetOpen(false)}
            aria-label="Close view selector"
          />
          <div className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-black/5 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Calendar View</h3>
              <button
                type="button"
                onClick={() => setIsViewSheetOpen(false)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors duration-150"
                aria-label="Close view selector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setViewMode(option.value)
                    setIsViewSheetOpen(false)
                  }}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                    viewMode === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <span>{option.label}</span>
                  {viewMode === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isFilterSheetOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40"
            onClick={() => setIsFilterSheetOpen(false)}
            aria-label="Close filters"
          />
          <div className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-black/5 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.08)] max-h-[78dvh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Filters</h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors duration-150"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {hasStaffSupport && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Staff</p>
                {staffOptions.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    No staff options available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffOptions.map((staff) => {
                      const checked = pendingStaffFilters.includes(staff)
                      return (
                        <button
                          key={staff}
                          type="button"
                          onClick={() => setPendingStaffFilters((current) => toggleMultiValue(current, staff))}
                          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                            checked
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-card hover:bg-accent"
                          }`}
                        >
                          <span>{staff}</span>
                          {checked && <Check className="h-4 w-4" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Service</p>
              {serviceOptions.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  No service options available
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceOptions.map((service) => {
                    const checked = pendingServiceFilters.includes(service)
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => setPendingServiceFilters((current) => toggleMultiValue(current, service))}
                        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                          checked
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card hover:bg-accent"
                        }`}
                      >
                        <span>{service}</span>
                        {checked && <Check className="h-4 w-4" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={clearPendingFilters}
                className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors duration-150"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-lg bg-primary text-primary-foreground px-3 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
