"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X, LayoutDashboard, Users, UserSquare, Calendar, CalendarDays, MessageSquare, Settings, LogOut } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NAV_PAGES } from "@/lib/navigation"
import { usePageVisibility } from "@/hooks/use-page-visibility"

const ICONS_BY_PAGE_ID = {
    dashboard: LayoutDashboard,
    leads: UserSquare,
    clients: Users,
    appointments: Calendar,
    calendar: CalendarDays,
    inbox: MessageSquare,
    settings: Settings,
} as const

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const { data: session } = useSession()
    const userKey = session?.user?.id || session?.user?.email || null
    const { isPageVisible } = usePageVisibility(userKey)
    const routes = NAV_PAGES.filter((page) => isPageVisible(page.id))

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="relative z-[60] p-2 -ml-2 rounded-lg hover:bg-accent transition-colors duration-150"
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 [top:calc(3.5rem+env(safe-area-inset-top))]" onClick={() => setOpen(false)} />
                    <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-neutral-900 border-r border-border shadow-xl animate-in slide-in-from-left duration-200 [top:calc(3.5rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
                        <nav className="px-3 py-4 space-y-1">
                            {routes.map((route) => {
                                const Icon = ICONS_BY_PAGE_ID[route.id]
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-150 min-h-[44px]",
                                            isActive(route.href)
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-4 w-4 shrink-0",
                                            isActive(route.href) ? "text-primary" : ""
                                        )} />
                                        {route.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-border">
                            <div className="flex items-center gap-3 px-3 py-2 mb-1">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session?.user?.image || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                        {session?.user?.name?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{session?.user?.name || "User"}</span>
                                    <span className="text-xs text-muted-foreground truncate">{session?.user?.email}</span>
                                </div>
                            </div>
                            <button
                                className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-150"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
