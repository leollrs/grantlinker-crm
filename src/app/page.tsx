"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <span className="text-primary-foreground text-lg font-bold">C</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM App</h1>
        <p className="text-sm text-muted-foreground">Customer relationship management</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </div>
  )
}
