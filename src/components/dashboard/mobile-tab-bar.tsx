"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, CreditCard, Menu, Plus, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  {
    id: "appointments",
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarDays,
  },
  {
    id: "clients",
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    id: "checkout",
    label: "Checkout",
    href: "/dashboard/checkout",
    icon: CreditCard,
  },
  {
    id: "more",
    label: "More",
    href: "/dashboard/more",
    icon: Menu,
  },
] as const

function isTabActive(pathname: string, href: string) {
  if (href === "/dashboard/appointments") {
    return pathname.startsWith("/dashboard/appointments") || pathname.startsWith("/dashboard/calendar")
  }
  if (href === "/dashboard/more") {
    return (
      pathname.startsWith("/dashboard/more") ||
      pathname.startsWith("/dashboard/settings") ||
      pathname.startsWith("/dashboard/team") ||
      pathname.startsWith("/dashboard/messages") ||
      pathname.startsWith("/dashboard/inbox") ||
      pathname.startsWith("/dashboard/notifications") ||
      pathname.startsWith("/dashboard/home") ||
      pathname === "/dashboard"
    )
  }
  return pathname.startsWith(href)
}

export function MobileTabBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const leftTabs = tabs.slice(0, 2)
  const rightTabs = tabs.slice(2)

  return (
    <>
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/90 backdrop-blur-[12px] supports-[backdrop-filter]:bg-white/90 pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-[5.25rem] grid-cols-5 items-center px-2">
          {leftTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[0.65rem] leading-none font-medium transition-colors duration-150",
                  isTabActive(pathname, tab.href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Quick add"
            className="flex flex-col items-center justify-center gap-1 text-[0.65rem] leading-none font-medium text-muted-foreground"
          >
            <span className="relative -mt-8 h-16 w-16 rounded-[20px] bg-primary text-primary-foreground border border-primary/20 shadow-[0_12px_30px_rgba(37,99,235,0.35)] flex items-center justify-center active:scale-95 transition-transform duration-150">
              <Plus className="h-7 w-7" />
            </span>
            <span>Add</span>
          </button>

          {rightTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[0.65rem] leading-none font-medium transition-colors duration-150",
                  isTabActive(pathname, tab.href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close quick add"
            className="lg:hidden fixed inset-0 z-[70] bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border-t border-black/5 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quick Add</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors duration-150"
                aria-label="Close quick add sheet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <Link
                href="/dashboard/appointments/new"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors duration-150"
              >
                <span>New Appointment</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/dashboard/clients/new"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors duration-150"
              >
                <span>New Client</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
