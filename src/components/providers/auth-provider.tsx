"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect, useState } from "react"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Prevent hydration mismatch by only rendering SessionProvider after mount
    if (!mounted) {
        return <>{children}</>
    }

    return (
        <SessionProvider
            refetchInterval={0}
            refetchOnWindowFocus={false}
        >
            {children}
        </SessionProvider>
    )
}
