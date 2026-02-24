"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { CalendarView } from "@/components/common/CalendarView"
import { MobileCalendarView } from "@/components/common/MobileCalendarView"
import { Card, CardContent } from "@/components/ui/card"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"
import { MOCK_APPOINTMENTS } from "@/lib/ui-mocks"

interface CalendarEvent {
  id: string
  title: string
  startTime: string | Date
  endTime: string | Date
  source: "local" | "google"
  clientName?: string | null
  leadName?: string | null
  userName?: string | null
}

interface AppointmentRecord {
  id: string
  title: string
  startTime: string | Date
  endTime: string | Date
  googleEventId?: string | null
  client?: { firstName: string; lastName: string } | null
  lead?: { firstName: string; lastName: string } | null
  user?: { name: string | null } | null
}

export function AppointmentsCalendarScreen() {
  const { status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!UI_ONLY_MODE && status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (UI_ONLY_MODE) {
      setAppointments(
        MOCK_APPOINTMENTS.map((apt) => ({
          id: apt.id,
          title: apt.title,
          startTime: apt.startTime,
          endTime: apt.endTime,
          source: "local",
          client: apt.clientName
            ? {
                firstName: apt.clientName.split(" ")[0] || apt.clientName,
                lastName: apt.clientName.split(" ").slice(1).join(" "),
              }
            : null,
          lead: null,
          user: apt.userName ? { name: apt.userName } : null,
          googleEventId: null,
        }))
      )
      setGoogleEvents([])
      setLoading(false)
      return
    }

    if (status === "authenticated") {
      fetchCalendarData()
    }
  }, [status, router])

  async function fetchCalendarData() {
    try {
      const [appointmentsRes, googleEventsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/appointments/google-events"),
      ])

      const appointmentsData: AppointmentRecord[] = await appointmentsRes.json()
      const googleEventsData: CalendarEvent[] = await googleEventsRes.json()

      setAppointments(appointmentsData)
      setGoogleEvents(googleEventsData)
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (UI_ONLY_MODE) {
      if (id.startsWith("google-")) {
        setGoogleEvents((prev) => prev.filter((event) => event.id !== id))
      } else {
        setAppointments((prev) => prev.filter((event) => event.id !== id))
      }
      return
    }

    try {
      if (id.startsWith("google-")) {
        console.log("Delete Google event:", id)
      } else {
        const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
        if (res.ok) {
          await fetchCalendarData()
        }
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  if ((!UI_ONLY_MODE && status === "loading") || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  const localAppointmentGoogleIds = new Set(
    appointments
      .filter((appointment) => appointment.googleEventId)
      .map((appointment) => appointment.googleEventId)
  )

  const localEvents: CalendarEvent[] = appointments.map((appointment) => ({
    id: appointment.id,
    title: appointment.title,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    source: "local" as const,
  }))

  const mobileLocalEvents: CalendarEvent[] = appointments.map((appointment) => ({
    id: appointment.id,
    title: appointment.title,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    source: "local" as const,
    clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : null,
    leadName: appointment.lead ? `${appointment.lead.firstName} ${appointment.lead.lastName}` : null,
    userName: appointment.user?.name || null,
  }))

  const filteredGoogleEvents = googleEvents.filter(
    (event) => !localAppointmentGoogleIds.has(event.id.replace("google-", ""))
  )

  const allEvents = [...localEvents, ...filteredGoogleEvents]
  const allMobileEvents = [...mobileLocalEvents, ...filteredGoogleEvents]

  return (
    <div className="flex-1 min-w-0 p-5 md:p-7 lg:p-9 pt-7 pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
          <p className="text-sm text-muted-foreground mt-2 hidden md:block">
            {googleEvents.length > 0
              ? "Showing local appointments and Google Calendar events"
              : "Manage your scheduled appointments"}
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-all duration-150 shadow-[0_8px_20px_rgba(37,99,235,0.2)]"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Link>
      </div>

      <div className="md:hidden">
        <MobileCalendarView events={allMobileEvents} onDelete={handleDelete} />
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-4 md:p-6">
          <CalendarView appointments={allEvents} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  )
}
