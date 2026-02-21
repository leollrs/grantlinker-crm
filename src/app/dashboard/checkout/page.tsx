"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Receipt } from "lucide-react"

export default function CheckoutPage() {
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
        <h2 className="text-2xl font-semibold tracking-tight">Checkout</h2>
        <p className="text-sm text-muted-foreground mt-1">Take payments and manage checkout flows.</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Checkout Tools
            </CardTitle>
            <CardDescription>Quick checkout features are ready to be expanded.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">No payment flow is configured yet in this build.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Need to add a client first?</p>
              <p className="text-xs text-muted-foreground mt-1">Create a client profile before checking out.</p>
            </div>
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors duration-150 shrink-0"
            >
              <Receipt className="h-4 w-4" />
              New Client
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
