"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, UserSquare, Calendar, CalendarDays, MessageSquare, Settings, LogOut } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        label: "Leads",
        icon: UserSquare,
        href: "/dashboard/leads",
    },
    {
        label: "Clients",
        icon: Users,
        href: "/dashboard/clients",
    },
    {
        label: "Appointments",
        icon: Calendar,
        href: "/dashboard/appointments",
    },
    {
        label: "Calendar",
        icon: CalendarDays,
        href: "/dashboard/calendar",
    },
    {
        label: "Inbox",
        icon: MessageSquare,
        href: "/dashboard/inbox",
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
            {/* Logo */}
            <div className="h-14 flex items-center px-6 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">C</span>
                    </div>
                    <span className="font-semibold text-foreground tracking-tight">CRM App</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                            isActive(route.href)
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        )}
                    >
                        <route.icon className={cn(
                            "h-4 w-4 shrink-0",
                            isActive(route.href) ? "text-primary" : ""
                        )} />
                        {route.label}
                    </Link>
                ))}
                <Link
                    href="/dashboard/settings"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive("/dashboard/settings")
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                >
                    <Settings className={cn(
                        "h-4 w-4 shrink-0",
                        isActive("/dashboard/settings") ? "text-primary" : ""
                    )} />
                    Settings
                </Link>
            </nav>

            {/* User section */}
            <div className="px-3 py-3 border-t border-sidebar-border">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate text-foreground">
                            {session?.user?.name || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            {session?.user?.email}
                        </span>
                    </div>
                </div>
                <button
                    className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-all duration-150"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-4 w-4" />
                    Log out
                </button>
            </div>
        </div>
    )
}
