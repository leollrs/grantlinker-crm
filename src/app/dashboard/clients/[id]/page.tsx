"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { ClientDetailsCard } from "@/components/clients/ClientDetailsCard"
import { ContactActionsCard } from "@/components/crm/ContactActionsCard"
import { AppointmentsTable } from "@/components/appointments/AppointmentsTable"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ClientProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && id) {
      fetchClient()
    }
  }, [status, router, id])

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${id}`)
      if (res.status === 404) {
        router.push("/dashboard/clients")
        return
      }
      const data = await res.json()
      setClient(data)
    } catch (error) {
      console.error("Failed to fetch client:", error)
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

  if (!client) {
    return null
  }

  const clientData = {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    createdAt: new Date(client.createdAt).toISOString(),
  }

  const conversationChannels = client.conversations?.map((c: any) => c.channel) || []

  const appointments = (client.appointments || [])
    .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .map((apt: any) => ({
      id: apt.id,
      title: apt.title,
      description: apt.description,
      startTime: new Date(apt.startTime).toISOString(),
      endTime: new Date(apt.endTime).toISOString(),
      status: apt.status,
      clientName: `${client.firstName} ${client.lastName}`,
      clientId: client.id,
      leadName: null,
      leadId: null,
    }))

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">{client.firstName} {client.lastName}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ClientDetailsCard client={clientData} />
        </div>

        <ContactActionsCard
          entityId={client.id}
          entityType="client"
          channels={{
            phone: client.phone,
            email: client.email,
            whatsappNumber: client.whatsappNumber,
            instagramUsername: client.instagramUsername,
            messengerId: client.messengerId,
          }}
          conversationChannels={conversationChannels}
        />
      </div>

      <AppointmentsTable appointments={appointments} />
    </div>
  )
}
