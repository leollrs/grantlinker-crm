"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { GoogleEventNotifications } from "@/components/dashboard/GoogleEventNotifications"
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments"
import { Users, UserPlus, Calendar } from "lucide-react"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"
import { MOCK_APPOINTMENTS, MOCK_DASHBOARD_STATS } from "@/lib/ui-mocks"

interface DashboardStats {
  leads: number
  clients: number
  appointments: number
}

interface Appointment {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  clientId: string | null
  leadId: string | null
  client: { firstName: string; lastName: string } | null
  lead: { firstName: string; lastName: string } | null
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({ leads: 0, clients: 0, appointments: 0 })
  const [upcoming, setUpcoming] = useState<Appointment[]>([])
  const [newGoogleEvents, setNewGoogleEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!UI_ONLY_MODE && status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (UI_ONLY_MODE) {
      setStats(MOCK_DASHBOARD_STATS)
      setUpcoming(
        MOCK_APPOINTMENTS.map((apt) => ({
          id: apt.id,
          title: apt.title,
          description: apt.description,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          clientId: apt.clientId,
          leadId: apt.leadId,
          client: apt.clientName
            ? {
                firstName: apt.clientName.split(" ")[0] || apt.clientName,
                lastName: apt.clientName.split(" ").slice(1).join(" "),
              }
            : null,
          lead: null,
        }))
      )
      setNewGoogleEvents([])
      setLoading(false)
      return
    }

    if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status, router])

  async function fetchDashboardData() {
    try {
      const [statsRes, appointmentsRes, googleEventsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/appointments"),
        fetch("/api/dashboard/google-events"),
      ])

      const statsData = await statsRes.json()
      const appointmentsData = await appointmentsRes.json()
      const googleEventsData = await googleEventsRes.json()

      setStats(statsData)
      setUpcoming(appointmentsData)
      setNewGoogleEvents(googleEventsData)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if ((!UI_ONLY_MODE && status === "loading") || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (!UI_ONLY_MODE && !session?.user) {
    return null
  }

  return (
    <div className="flex-1 min-w-0 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your CRM activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-semibold tracking-tight mt-1">{stats.leads}</p>
                <p className="text-xs text-muted-foreground mt-1">Potential customers</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-3xl font-semibold tracking-tight mt-1">{stats.clients}</p>
                <p className="text-xs text-muted-foreground mt-1">Existing customers</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Appointments</p>
                <p className="text-3xl font-semibold tracking-tight mt-1">{stats.appointments}</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GoogleEventNotifications events={newGoogleEvents} />

      <UpcomingAppointments appointments={upcoming.map((apt) => ({
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
      }))} />
    </div>
  )
}
