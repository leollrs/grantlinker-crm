"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"
import { MOCK_CLIENTS, MOCK_LEADS } from "@/lib/ui-mocks"

const selectClass = "flex min-h-[44px] md:min-h-0 h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"

export default function NewAppointmentPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (UI_ONLY_MODE) {
      setClients([...MOCK_CLIENTS])
      setLeads([...MOCK_LEADS])
      setFetching(false)
      return
    }

    async function fetchData() {
      try {
        const [clientsRes, leadsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/leads"),
        ])
        const clientsData = await clientsRes.json()
        const leadsData = await leadsRes.json()
        setClients(clientsData)
        setLeads(leadsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      clientId: formData.get("clientId") as string || null,
      leadId: formData.get("leadId") as string || null,
    }

    try {
      if (UI_ONLY_MODE) {
        router.push("/dashboard/appointments")
        return
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push("/dashboard/appointments")
      } else {
        console.error("Failed to create appointment")
      }
    } catch (error) {
      console.error("Failed to create appointment:", error)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <Link href="/dashboard/appointments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">Schedule Appointment</h2>
      </div>
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              Schedule a new appointment.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Meeting with..." required className="min-h-[44px] md:min-h-0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Notes..." className="min-h-[44px] md:min-h-0" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" name="startTime" type="datetime-local" required className="min-h-[44px] md:min-h-0" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" name="endTime" type="datetime-local" required className="min-h-[44px] md:min-h-0" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client (Optional)</Label>
                <select name="clientId" id="clientId" className={selectClass}>
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leadId">Lead (Optional)</Label>
                <select name="leadId" id="leadId" className={selectClass}>
                  <option value="">Select Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                  ))}
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px] md:min-h-0">
                {loading ? "Scheduling..." : "Schedule"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
