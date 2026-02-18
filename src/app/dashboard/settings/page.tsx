"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ConnectGoogleButton } from "@/components/settings/ConnectGoogleButton"
import { ConnectMetaButton } from "@/components/settings/ConnectMetaButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SettingsData {
  id: string
  name: string | null
  email: string
  role: string
  tenantId: string
  tenant: { name: string }
  accounts: Array<{ provider: string }>
  metaPage?: { pageName: string; igUsername: string | null } | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchSettings()
    }
  }, [status, router])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      setUser(data)
      setName(data.name || "")
      setTenantName(data.tenant?.name || "")
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await fetchSettings()
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateTenant(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName }),
      })
      if (res.ok) {
        await fetchSettings()
      }
    } catch (error) {
      console.error("Failed to update tenant:", error)
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and integrations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect external services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <p className="text-sm font-medium">Google Calendar</p>
                <p className="text-xs text-muted-foreground">
                  Sync appointments with Google Calendar.
                </p>
              </div>
              <ConnectGoogleButton isConnected={user.accounts.some((a: any) => a.provider === "google-calendar")} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <p className="text-sm font-medium">Facebook / Instagram</p>
                <p className="text-xs text-muted-foreground">
                  {user.metaPage
                    ? `Connected: ${user.metaPage.pageName}${user.metaPage.igUsername ? ` (@${user.metaPage.igUsername})` : ""}`
                    : "Send and receive Messenger and Instagram DMs."}
                </p>
              </div>
              <ConnectMetaButton isConnected={!!user.metaPage} />
            </div>
          </CardContent>
        </Card>

        {user.role === "ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Manage your organization details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Organization Name</Label>
                  <Input
                    id="tenantName"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Organization name"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Organization"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
