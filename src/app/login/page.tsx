"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const registered = searchParams.get("registered")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid credentials")
                setIsLoading(false)
            } else {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (err) {
            setError("An error occurred")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-dvh min-h-screen w-full max-w-full items-center justify-center bg-background p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center mx-auto">
                        <span className="text-primary-foreground text-sm font-bold">C</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">Enter your credentials to sign in.</p>
                </div>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="grid gap-4 pt-6">
                            {registered && (
                                <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm p-3 ring-1 ring-inset ring-emerald-600/20">
                                    Account created successfully. Please sign in.
                                </div>
                            )}
                            {error && (
                                <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 ring-1 ring-inset ring-destructive/20">
                                    {error}
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-primary font-medium hover:underline underline-offset-4">
                                    Sign up
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
