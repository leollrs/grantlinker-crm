"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MetaPage {
  id: string
  pageId: string
  pageName: string
  igUsername: string | null
}

export default function MetaPagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accountId = searchParams.get("accountId")
  const [pages, setPages] = useState<MetaPage[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (!accountId) {
      router.push("/dashboard/settings")
      return
    }

    if (status === "authenticated") {
      fetchPages()
    }
  }, [status, router, accountId])

  async function fetchPages() {
    try {
      const res = await fetch(`/api/meta/pages?accountId=${accountId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.length === 0) {
          router.push("/dashboard/settings?meta=connected")
          return
        }
        setPages(data)
      } else {
        router.push("/dashboard/settings")
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error)
      router.push("/dashboard/settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate(pageId: string) {
    setActivating(pageId)
    try {
      const res = await fetch("/api/meta/pages/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      })

      if (res.ok) {
        router.push("/dashboard/settings?meta=connected")
      } else {
        console.error("Failed to activate page")
      }
    } catch (error) {
      console.error("Failed to activate page:", error)
    } finally {
      setActivating(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (pages.length === 0) {
    router.push("/dashboard/settings?meta=connected")
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Select a Facebook Page</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which page to connect for Messenger and Instagram DMs.
        </p>
      </div>
      <div className="grid gap-4 max-w-2xl">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <CardTitle className="text-lg">{page.pageName}</CardTitle>
              {page.igUsername && (
                <CardDescription>Instagram: @{page.igUsername}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => handleActivate(page.pageId)}
                disabled={activating === page.pageId}
              >
                {activating === page.pageId ? "Connecting..." : "Connect this page"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
