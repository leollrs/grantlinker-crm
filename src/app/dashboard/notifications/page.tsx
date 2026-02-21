"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"

export default function NotificationsPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">Recent alerts and updates.</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No notifications yet</p>
        <p className="text-sm text-muted-foreground mt-1">New activity will appear here.</p>
      </div>
    </div>
  )
}
