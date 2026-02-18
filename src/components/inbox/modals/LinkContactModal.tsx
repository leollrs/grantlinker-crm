"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, UserPlus, Link2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Contact {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string
    type: "lead" | "client"
}

interface LinkContactModalProps {
    conversationId: string
    open: boolean
    onClose: () => void
    onLinked: () => void
}

export function LinkContactModal({ conversationId, open, onClose, onLinked }: LinkContactModalProps) {
    const [mode, setMode] = useState<"choose" | "search">("choose")
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Contact[]>([])
    const [searching, setSearching] = useState(false)
    const [creating, setCreating] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setMode("choose")
            setQuery("")
            setResults([])
        }
    }, [open])

    useEffect(() => {
        if (mode === "search") searchRef.current?.focus()
    }, [mode])

    useEffect(() => {
        if (!query.trim() || mode !== "search") {
            setResults([])
            return
        }
        const timeout = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(query.trim())}`)
                if (res.ok) setResults(await res.json())
            } catch { }
            setSearching(false)
        }, 300)
        return () => clearTimeout(timeout)
    }, [query, mode])

    const handleCreateLead = async () => {
        setCreating(true)
        try {
            const res = await fetch("/api/leads/from-conversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId }),
            })
            if (res.ok) {
                onLinked()
                onClose()
            }
        } catch { }
        setCreating(false)
    }

    const handleLinkExisting = async (contact: Contact) => {
        try {
            const body = contact.type === "lead"
                ? { leadId: contact.id }
                : { clientId: contact.id }
            const res = await fetch(`/api/conversations/${conversationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                onLinked()
                onClose()
            }
        } catch { }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold">Link to Contact</h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5">
                    {mode === "choose" ? (
                        <div className="space-y-3">
                            <button
                                onClick={handleCreateLead}
                                disabled={creating}
                                className="w-full flex items-center gap-3 p-3.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <UserPlus className="h-4 w-4 text-emerald-600" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Create new Lead</p>
                                    <p className="text-xs text-muted-foreground">Create a lead from this conversation's info</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setMode("search")}
                                className="w-full flex items-center gap-3 p-3.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                                    <Link2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Link to existing contact</p>
                                    <p className="text-xs text-muted-foreground">Search leads & clients by name, phone, or email</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={() => setMode("choose")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                &larr; Back
                            </button>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by name, phone, email..."
                                    className="w-full h-10 pl-9 pr-4 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {searching && (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {!searching && query && results.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-6">No contacts found</p>
                                )}
                                {results.map((c) => (
                                    <button
                                        key={`${c.type}-${c.id}`}
                                        onClick={() => handleLinkExisting(c)}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-[11px] font-semibold text-muted-foreground">
                                            {c.firstName[0]}{c.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{c.phone || c.email}</p>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                            c.type === "lead"
                                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                        )}>
                                            {c.type === "lead" ? "Lead" : "Client"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
