import Link from "next/link"
import { Bell, UserCircle2 } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-dvh lg:min-h-dvh relative overflow-hidden w-full max-w-full min-w-0">
            {/* Desktop sidebar */}
            <div className="hidden h-full lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 z-[80]">
                <Sidebar />
            </div>

            {/* Mobile top bar */}
            <div
                className="lg:hidden fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-[12px] pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))]"
            >
                <div className="h-14 px-4 flex items-center justify-between">
                    <Link href="/dashboard/appointments" className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-xs font-bold">C</span>
                        </div>
                        <span className="font-semibold text-foreground tracking-tight">CRM App</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Link
                            href="/dashboard/notifications"
                            className="h-9 w-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-accent transition-colors duration-150"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            className="h-9 w-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-accent transition-colors duration-150"
                            aria-label="Profile"
                        >
                            <UserCircle2 className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main content — safe area insets for iOS notch/home indicator, contain overflow */}
            <main
                className="lg:pl-60 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto h-[calc(100dvh-(3.5rem+env(safe-area-inset-top)))] lg:h-auto lg:min-h-dvh pt-0 lg:pt-0 mt-[calc(3.5rem+env(safe-area-inset-top))] lg:mt-0 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pr-0 lg:pb-0"
                data-viewport-scroll
            >
                {children}
            </main>

            <MobileTabBar />
        </div>
    )
}
