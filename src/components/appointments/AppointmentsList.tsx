"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AppointmentDetailModal } from "./AppointmentDetailModal"
import { format, isToday, isTomorrow, isYesterday, startOfDay } from "date-fns"

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
  userName: string | null
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "badge-scheduled"
    case "COMPLETED":
      return "badge-completed"
    case "CANCELLED":
      return "badge-cancelled"
    default:
      return "badge-new"
  }
}

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEEE, MMMM d")
}

export function AppointmentsList({ appointments }: { appointments: AppointmentData[] }) {
  const [selected, setSelected] = useState<AppointmentData | null>(null)

  // Group by day
  const grouped = new Map<string, AppointmentData[]>()
  for (const apt of appointments) {
    const key = startOfDay(new Date(apt.startTime)).toISOString()
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(apt)
  }

  const sortedDays = [...grouped.keys()].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  const todayStart = startOfDay(new Date())
  const upcomingDays = sortedDays.filter((d) => new Date(d) >= todayStart)
  const pastDays = sortedDays.filter((d) => new Date(d) < todayStart).reverse()

  return (
    <>
      <div className="space-y-8">
        {upcomingDays.length > 0 && (
          <div className="space-y-6">
            {upcomingDays.map((dayKey) => (
              <DayGroup
                key={dayKey}
                date={new Date(dayKey)}
                appointments={grouped.get(dayKey)!}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}

        {pastDays.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Past
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-6 opacity-60">
              {pastDays.map((dayKey) => (
                <DayGroup
                  key={dayKey}
                  date={new Date(dayKey)}
                  appointments={grouped.get(dayKey)!}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function DayGroup({
  date,
  appointments,
  onSelect,
}: {
  date: Date
  appointments: AppointmentData[]
  onSelect: (apt: AppointmentData) => void
}) {
  const today = isToday(date)

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold shrink-0 ${
            today ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {format(date, "d")}
        </div>
        <div>
          <p className={`text-sm font-semibold ${today ? "text-primary" : "text-foreground"}`}>
            {formatDayLabel(date)}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(date, "MMMM yyyy")} &middot; {appointments.length} appointment
            {appointments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {appointments.map((apt) => {
          const start = new Date(apt.startTime)
          const end = new Date(apt.endTime)
          const contactName = apt.clientName || apt.leadName
          const contactType = apt.clientName ? "Client" : apt.leadName ? "Lead" : null

          return (
            <div
              key={apt.id}
              onClick={() => onSelect(apt)}
              className="w-full rounded-xl border bg-white dark:bg-neutral-800/60 p-4 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <div className="grid grid-cols-[90px_1fr_auto] items-start gap-3 w-full">
                {/* COL 1: Time */}
                <div className="text-sm leading-tight whitespace-nowrap">
                  <div className="font-medium text-foreground tabular-nums">
                    {format(start, "h:mm a")}
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {format(end, "h:mm a")}
                  </div>
                </div>

                {/* COL 2: Details */}
                <div className="min-w-0 leading-snug">
                  <div className="font-medium text-sm truncate">{apt.title}</div>
                  {contactName && (
                    <div className="mt-1 flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
                      <span className="truncate">{contactName}</span>
                      {contactType && (
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                            contactType === "Client"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {contactType}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* COL 3: Status */}
                <div className="flex justify-end pt-0.5">
                  <span className={`badge ${statusBadgeClass(apt.status)}`}>
                    {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop rows */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          {appointments.map((apt, i) => {
            const start = new Date(apt.startTime)
            const end = new Date(apt.endTime)
            const contactName = apt.clientName || apt.leadName
            const contactType = apt.clientName ? "Client" : apt.leadName ? "Lead" : null

            return (
              <div
                key={apt.id}
                onClick={() => onSelect(apt)}
                className={`grid grid-cols-[180px_1fr_140px] items-start gap-6 p-4 hover:bg-muted/30 transition-colors duration-150 cursor-pointer ${
                  i < appointments.length - 1 ? "border-b" : ""
                }`}
              >
                {/* COL 1: Time */}
                <div className="text-sm leading-tight whitespace-nowrap">
                  <div className="font-medium text-foreground tabular-nums">
                    {format(start, "h:mm a")} –
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {format(end, "h:mm a")}
                  </div>
                </div>

                {/* COL 2: Details */}
                <div className="min-w-0 leading-snug">
                  <div className="font-medium truncate">{apt.title}</div>

                  <div className="mt-1 flex items-center gap-2 min-w-0 text-sm text-muted-foreground">
                    {contactName ? (
                      <>
                        <span className="truncate">{contactName}</span>
                        {contactType && (
                          <span
                            className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                              contactType === "Client"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {contactType}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </div>
                </div>

                {/* COL 3: Status */}
                <div className="flex justify-end pt-0.5">
                  <span className={`badge ${statusBadgeClass(apt.status)}`}>
                    {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}