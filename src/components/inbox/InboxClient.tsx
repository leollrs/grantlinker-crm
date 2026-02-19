"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ConversationList } from "./ConversationList"
import { ChatPanel } from "./ChatPanel"
import { MessageSquare } from "lucide-react"

export interface Conversation {
    id: string
    phoneNumber: string
    channel: string
    lastMessageAt: string | Date
    unreadCount: number
    status: string
    displayName: string | null
    notes: string | null
    client: { id: string; firstName: string; lastName: string } | null
    lead: { id: string; firstName: string; lastName: string } | null
    messages: { body: string; direction: string; createdAt: string | Date }[]
}

export type ChannelFilter = "all" | "whatsapp" | "instagram" | "facebook" | "sms"
export type ViewFilter = "inbox" | "archived"

interface InboxClientProps {
    initialConversations: Conversation[]
}

export function InboxClient({ initialConversations }: InboxClientProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const urlChannel = (searchParams.get("channel") || "all") as ChannelFilter
    const urlView = (searchParams.get("view") || "inbox") as ViewFilter

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [channelFilter, setChannelFilter] = useState<ChannelFilter>(urlChannel)
    const [viewFilter, setViewFilter] = useState<ViewFilter>(urlView)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const params = new URLSearchParams()
        if (channelFilter !== "all") params.set("channel", channelFilter)
        if (viewFilter !== "inbox") params.set("view", viewFilter)
        const qs = params.toString()
        window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
    }, [channelFilter, viewFilter])

    const filteredConversations = useMemo(() => {
        let result = initialConversations

        result = viewFilter === "archived"
            ? result.filter((c) => c.status === "archived")
            : result.filter((c) => c.status === "active")

        if (channelFilter !== "all") {
            result = result.filter((c) => c.channel === channelFilter)
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter((c) => {
                const name = c.displayName
                    || (c.client ? `${c.client.firstName} ${c.client.lastName}` : null)
                    || (c.lead ? `${c.lead.firstName} ${c.lead.lastName}` : null)
                    || c.phoneNumber
                const lastMsg = c.messages[0]?.body || ""
                return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q)
            })
        }

        return result
    }, [initialConversations, channelFilter, viewFilter, searchQuery])

    const channelCounts = useMemo(() => {
        const viewFiltered = viewFilter === "archived"
            ? initialConversations.filter((c) => c.status === "archived")
            : initialConversations.filter((c) => c.status === "active")
        const counts = { all: viewFiltered.length, whatsapp: 0, instagram: 0, facebook: 0, sms: 0 }
        for (const c of viewFiltered) {
            if (c.channel in counts) counts[c.channel as keyof typeof counts]++
        }
        return counts
    }, [initialConversations, viewFilter])

    const handleSelect = useCallback((id: string) => setSelectedId(id), [])
    const handleBack = useCallback(() => setSelectedId(null), [])
    const handleConversationUpdated = useCallback(() => router.refresh(), [router])

    return (
        <div className="flex h-full min-w-0 max-w-full overflow-x-hidden">
            {/* Conversation list — 360px on desktop */}
            <div className={`w-full md:w-[360px] flex-shrink-0 flex flex-col bg-white dark:bg-neutral-900 border-r border-border/30 ${
                selectedId ? "hidden md:flex" : "flex"
            }`}>
                <ConversationList
                    conversations={filteredConversations}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    channelFilter={channelFilter}
                    onChannelFilterChange={setChannelFilter}
                    channelCounts={channelCounts}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    viewFilter={viewFilter}
                    onViewFilterChange={setViewFilter}
                />
            </div>

            {/* Chat window — flex remaining */}
            <div className={`flex-1 flex flex-col min-w-0 ${
                selectedId ? "flex" : "hidden md:flex"
            }`}>
                {selectedId ? (
                    <ChatPanel
                        conversationId={selectedId}
                        onBack={handleBack}
                        onConversationUpdated={handleConversationUpdated}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-white dark:bg-neutral-950">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5">
                            <MessageSquare className="h-9 w-9 text-primary/30" />
                        </div>
                        <p className="text-[16px] font-semibold text-foreground/70">
                            Select a chat
                        </p>
                        <p className="text-[13px] text-muted-foreground/50 mt-1.5 max-w-[260px] leading-relaxed">
                            Pick a conversation from the list to view messages.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
