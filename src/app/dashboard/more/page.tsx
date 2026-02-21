"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChevronRight, Home, MessageSquare, Settings, ShieldPlus, Users } from "lucide-react"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"

const items = [
  {
    label: "Home",
    description: "Open your dashboard overview",
    href: "/dashboard/home",
    icon: Home,
  },
  {
    label: "Settings",
    description: "Account and integrations",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Team",
    description: "Team members and roles",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    label: "Messages",
    description: "Inbox and conversations",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
] as const

export default function MorePage() {
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
        <h2 className="text-2xl font-semibold tracking-tight">More</h2>
        <p className="text-sm text-muted-foreground mt-1">Settings and extra tools.</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-border bg-card overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 border-b border-border last:border-b-0 hover:bg-accent transition-colors duration-150"
            >
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          )
        })}

        <div className="flex items-center gap-3 p-4 opacity-70 bg-muted/20">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ShieldPlus className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Marketing</p>
            <p className="text-xs text-muted-foreground mt-0.5">Automation and campaigns.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
            Pro
          </span>
        </div>
      </div>
    </div>
  )
}
