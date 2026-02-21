"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
    }

    try {
      if (UI_ONLY_MODE) {
        router.push("/dashboard/clients")
        return
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push("/dashboard/clients")
      } else {
        console.error("Failed to create client")
      }
    } catch (error) {
      console.error("Failed to create client:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      <div>
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">Create Client</h2>
      </div>
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Enter the details of the new client.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" placeholder="John" required className="min-h-[44px] md:min-h-0" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" required className="min-h-[44px] md:min-h-0" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required className="min-h-[44px] md:min-h-0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1234567890" className="min-h-[44px] md:min-h-0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input id="address" name="address" placeholder="123 Main St" className="min-h-[44px] md:min-h-0" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto min-h-[44px] md:min-h-0">
                {loading ? "Creating..." : "Create Client"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
