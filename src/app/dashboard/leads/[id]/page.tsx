"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { LeadDetailsCard } from "@/components/leads/LeadDetailsCard"
import { ContactActionsCard } from "@/components/crm/ContactActionsCard"
import { AppointmentsTable } from "@/components/appointments/AppointmentsTable"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LeadDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && id) {
      fetchLead()
    }
  }, [status, router, id])

  async function fetchLead() {
    try {
      const res = await fetch(`/api/leads/${id}`)
      if (res.status === 404) {
        router.push("/dashboard/leads")
        return
      }
      const data = await res.json()
      setLead(data)
    } catch (error) {
      console.error("Failed to fetch lead:", error)
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

  if (!lead) {
    return null
  }

  const leadData = {
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    companyName: lead.companyName,
    status: lead.status,
    value: lead.value ? Number(lead.value) : null,
    convertedClientId: lead.convertedClientId,
    createdAt: new Date(lead.createdAt).toISOString(),
  }

  const conversationChannels = lead.conversations?.map((c: any) => c.channel) || []

  const leadAppointments = lead.appointments || []
  const clientAppointments = lead.convertedClient?.appointments || []
  const allAppointmentMap = new Map()
  for (const apt of leadAppointments) allAppointmentMap.set(apt.id, apt)
  for (const apt of clientAppointments) allAppointmentMap.set(apt.id, apt)

  const leadName = `${lead.firstName} ${lead.lastName}`
  const clientName = lead.convertedClient ? `${lead.convertedClient.firstName} ${lead.convertedClient.lastName}` : null

  const appointments = Array.from(allAppointmentMap.values())
    .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .map((apt: any) => ({
      id: apt.id,
      title: apt.title,
      description: apt.description,
      startTime: new Date(apt.startTime).toISOString(),
      endTime: new Date(apt.endTime).toISOString(),
      status: apt.status,
      clientName: apt.clientId ? clientName : null,
      clientId: apt.clientId,
      leadName: apt.leadId ? leadName : null,
      leadId: apt.leadId,
    }))

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <Link href="/dashboard/leads" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">{lead.firstName} {lead.lastName}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <LeadDetailsCard lead={leadData} />
        </div>

        <ContactActionsCard
          entityId={lead.id}
          entityType="lead"
          channels={{
            phone: lead.phone,
            email: lead.email,
            whatsappNumber: lead.whatsappNumber,
            instagramUsername: lead.instagramUsername,
            messengerId: lead.messengerId,
          }}
          conversationChannels={conversationChannels}
        />
      </div>

      <AppointmentsTable appointments={appointments} />
    </div>
  )
}
