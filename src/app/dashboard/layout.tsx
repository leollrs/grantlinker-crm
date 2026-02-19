import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"

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
                className="lg:hidden fixed inset-x-0 top-0 z-50 border-b border-border bg-white dark:bg-neutral-900 flex items-center px-4 pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))]"
            >
                <MobileNav />
                <div className="flex items-center gap-2 ml-3">
                    <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">C</span>
                    </div>
                    <span className="font-semibold text-foreground tracking-tight">CRM App</span>
                </div>
            </div>

            {/* Main content — safe area insets for iOS notch/home indicator, contain overflow */}
            <main
                className="lg:pl-60 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto h-[calc(100dvh-(3.5rem+env(safe-area-inset-top)))] lg:h-auto lg:min-h-dvh pt-0 lg:pt-0 mt-[calc(3.5rem+env(safe-area-inset-top))] lg:mt-0 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] lg:pr-0 lg:pb-0"
                data-viewport-scroll
            >
                {children}
            </main>
        </div>
    )
}
