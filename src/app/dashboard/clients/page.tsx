"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getClients, deleteClient } from "@/lib/actions/clients"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteButton } from "@/components/common/DeleteButton"
import { Plus, ChevronRight } from "lucide-react"

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchClients()
    }
  }, [status, router])

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
      if (res.ok) {
        setClients(clients.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete client:", error)
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
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} total clients</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Client</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No clients yet. Add your first client to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {clients.map((client) => (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="block">
                <Card className="active:scale-[0.99] transition-transform duration-150">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{client.firstName} {client.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{client.email}</p>
                        {client.phone && (
                          <p className="text-xs text-muted-foreground mt-0.5">{client.phone}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="h-11 px-4 text-left font-medium text-muted-foreground">Name</th>
                      <th className="h-11 px-4 text-left font-medium text-muted-foreground">Email</th>
                      <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                      <th className="h-11 px-4 text-right font-medium text-muted-foreground w-28"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/clients/${client.id}`} className="font-medium hover:text-primary transition-colors duration-150">
                            {client.firstName} {client.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{client.phone || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/clients/${client.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(client.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
