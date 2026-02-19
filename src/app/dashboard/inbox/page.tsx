"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { InboxClient } from "@/components/inbox/InboxClient"

export default function InboxPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchConversations()
    }
  }, [status, router])

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations?archived=true")
      const data = await res.json()
      setConversations(data)
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] lg:h-dvh overflow-hidden flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-dvh overflow-hidden">
      <InboxClient initialConversations={conversations} />
    </div>
  )
}
