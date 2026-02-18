"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { disconnectMeta } from "@/lib/actions/meta"

interface Props {
    isConnected: boolean
}

export function ConnectMetaButton({ isConnected }: Props) {
    if (isConnected) {
        return (
            <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 text-emerald-500" />
                    Connected
                </Button>
                <form action={disconnectMeta as unknown as () => void}>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        className="text-destructive hover:text-destructive"
                    >
                        Disconnect
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <Button variant="outline" size="sm" className="shrink-0" asChild>
            <a href="/api/meta/login">Connect</a>
        </Button>
    )
}
