"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { disconnectGoogle } from "@/lib/actions/settings"

export function ConnectGoogleButton({ isConnected }: { isConnected: boolean }) {
    const [isPending, startTransition] = useTransition()

    function handleDisconnect() {
        startTransition(async () => {
            await disconnectGoogle()
        })
    }

    if (isConnected) {
        return (
            <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 text-emerald-500" />
                    Connected
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
                </Button>
            </div>
        )
    }

    return (
        <Button variant="outline" size="sm" className="shrink-0" asChild>
            <a href="/api/google/connect">Connect</a>
        </Button>
    )
}
