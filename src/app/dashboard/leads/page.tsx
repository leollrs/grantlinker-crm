"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { LeadsTable } from "@/components/leads/LeadsTable"
import { Plus } from "lucide-react"

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: string
  whatsappNumber: string | null
  instagramUsername: string | null
  messengerId: string | null
  createdAt: string
}

export default function LeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchLeads()
    }
  }, [status, router])

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(data)
    } catch (error) {
      console.error("Failed to fetch leads:", error)
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

  const serializedLeads = leads.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    whatsappNumber: lead.whatsappNumber,
    instagramUsername: lead.instagramUsername,
    messengerId: lead.messengerId,
    createdAt: lead.createdAt,
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} total leads</p>
        </div>
        <Link href="/dashboard/leads/new">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Lead</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No leads yet. Create your first lead to get started.
          </CardContent>
        </Card>
      ) : (
        <LeadsTable leads={serializedLeads} />
      )}
    </div>
  )
}
