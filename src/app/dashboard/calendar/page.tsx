"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarView } from "@/components/common/CalendarView"
import { MobileCalendarView } from "@/components/common/MobileCalendarView"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
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
}

export default function CalendarPage() {
  const { status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [googleEvents, setGoogleEvents] = useState<any[]>([])
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

      const appointmentsData = await appointmentsRes.json()
      const googleEventsData = await googleEventsRes.json()

      setAppointments(appointmentsData)
      setGoogleEvents(googleEventsData)
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      if (id.startsWith("google-")) {
        // Delete Google event - would need API endpoint
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
    appointments.filter((a: any) => a.googleEventId).map((a: any) => a.googleEventId)
  )

  const localEvents = appointments.map((a: any) => ({
    id: a.id,
    title: a.title,
    startTime: a.startTime,
    endTime: a.endTime,
    source: "local" as const,
  }))

  const mobileLocalEvents = appointments.map((a: any) => ({
    id: a.id,
    title: a.title,
    startTime: a.startTime,
    endTime: a.endTime,
    source: "local" as const,
    clientName: a.client ? `${a.client.firstName} ${a.client.lastName}` : null,
    leadName: a.lead ? `${a.lead.firstName} ${a.lead.lastName}` : null,
  }))

  const filteredGoogleEvents = googleEvents.filter(
    (e: any) => !localAppointmentGoogleIds.has(e.id.replace("google-", ""))
  )

  const allEvents = [...localEvents, ...filteredGoogleEvents]
  const allMobileEvents = [...mobileLocalEvents, ...filteredGoogleEvents]

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1 hidden md:block">
            {googleEvents.length > 0
              ? "Showing local appointments and Google Calendar events"
              : "Manage your scheduled appointments"
            }
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all duration-150 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Link>
      </div>

      {/* Mobile: Agenda view */}
      <div className="md:hidden">
        <MobileCalendarView events={allMobileEvents} onDelete={handleDelete} />
      </div>

      {/* Desktop: Grid calendar */}
      <Card className="hidden md:block">
        <CardContent className="p-4 md:p-6">
          <CalendarView appointments={allEvents} onDelete={handleDelete} />
        </CardContent>
      </Card>

    </div>
  )
}
