import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-dvh relative overflow-x-hidden w-full max-w-full">
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

            {/* Main content */}
            <main className="lg:pl-60 min-h-dvh overflow-x-hidden w-full max-w-full pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0">
                {children}
            </main>
        </div>
    )
}
