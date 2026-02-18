"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppointmentsList } from "@/components/appointments/AppointmentsList"
import { Plus, Calendar } from "lucide-react"

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
  userName: string | null
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchAppointments()
    }
  }, [status, router])

  async function fetchAppointments() {
    try {
      const res = await fetch("/api/appointments")
      const data = await res.json()
      const serialized = data
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .map((apt: any) => ({
          id: apt.id,
          title: apt.title,
          description: apt.description,
          startTime: new Date(apt.startTime).toISOString(),
          endTime: new Date(apt.endTime).toISOString(),
          status: apt.status,
          clientName: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : null,
          clientId: apt.clientId,
          leadName: apt.lead ? `${apt.lead.firstName} ${apt.lead.lastName}` : null,
          leadId: apt.leadId,
          userName: apt.user?.name || null,
        }))
      setAppointments(serialized)
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 pt-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Appointments</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {appointments.length} total
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

      {appointments.length === 0 ? (
        <div className="py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No appointments yet</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule your first appointment to get started.</p>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </Link>
        </div>
      ) : (
        <AppointmentsList appointments={appointments} />
      )}

      {/* Mobile FAB */}
      <Link
        href="/dashboard/appointments/new"
        className="md:hidden fixed bottom-6 right-6 z-40 h-14 w-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform duration-150"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
