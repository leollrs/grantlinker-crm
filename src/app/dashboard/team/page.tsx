"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Users } from "lucide-react"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"

export default function TeamPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!UI_ONLY_MODE && status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (!UI_ONLY_MODE && status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Team</h2>
        <p className="text-sm text-muted-foreground mt-1">Invite and manage team members.</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Team management is ready for MVP expansion</p>
        <p className="text-sm text-muted-foreground mt-1">No advanced permission system was added.</p>
      </div>
    </div>
  )
}
