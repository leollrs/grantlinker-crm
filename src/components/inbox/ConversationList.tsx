"use client"

import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { MessageSquare, Search, X, Inbox, Archive } from "lucide-react"
import type { Conversation, ChannelFilter, ViewFilter } from "./InboxClient"

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    onSelect: (id: string) => void
    channelFilter: ChannelFilter
    onChannelFilterChange: (filter: ChannelFilter) => void
    channelCounts: Record<string, number>
    searchQuery: string
    onSearchChange: (query: string) => void
    viewFilter: ViewFilter
    onViewFilterChange: (view: ViewFilter) => void
}

const FILTERS: { key: ChannelFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "sms", label: "SMS" },
]

function getContactName(conv: Conversation): string {
    if (conv.displayName) return conv.displayName
    if (conv.client) return `${conv.client.firstName} ${conv.client.lastName}`
    if (conv.lead) return `${conv.lead.firstName} ${conv.lead.lastName}`
    return conv.phoneNumber
}

function getInitials(conv: Conversation): string {
    const name = conv.displayName
        || (conv.client ? `${conv.client.firstName} ${conv.client.lastName}` : null)
        || (conv.lead ? `${conv.lead.firstName} ${conv.lead.lastName}` : null)
    if (name) {
        const parts = name.trim().split(/\s+/)
        return parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : parts[0][0]?.toUpperCase() || "#"
    }
    return "#"
}

function ChannelDot({ channel }: { channel: string }) {
    const colors: Record<string, string> = {
        whatsapp: "bg-green-500",
        instagram: "bg-gradient-to-tr from-purple-500 to-pink-500",
        facebook: "bg-blue-500",
        sms: "bg-neutral-400",
    }
    return (
        <span className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-900",
            colors[channel] || "bg-neutral-300"
        )} />
    )
}

function ConversationRow({
    conv,
    isSelected,
    onSelect,
}: {
    conv: Conversation
    isSelected: boolean
    onSelect: (id: string) => void
}) {
    const lastMessage = conv.messages[0]
    const hasUnread = conv.unreadCount > 0

    return (
        <button
            onClick={() => onSelect(conv.id)}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-75",
                isSelected
                    ? "bg-primary/[0.08] dark:bg-primary/[0.15]"
                    : "hover:bg-slate-50/80 dark:hover:bg-neutral-800/40"
            )}
        >
            {/* Avatar with channel dot */}
            <div className="relative shrink-0">
                <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center text-[13px] font-semibold",
                    hasUnread
                        ? "bg-primary text-primary-foreground"
                        : "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400"
                )}>
                    {getInitials(conv)}
                </div>
                <ChannelDot channel={conv.channel} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                        "text-[14px] truncate leading-tight",
                        hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                    )}>
                        {getContactName(conv)}
                    </span>
                    <span className={cn(
                        "text-[11px] shrink-0 tabular-nums",
                        hasUnread ? "text-primary font-semibold" : "text-muted-foreground/60"
                    )}>
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn(
                        "text-[13px] truncate leading-tight",
                        hasUnread ? "text-foreground/70 font-medium" : "text-muted-foreground/60"
                    )}>
                        {lastMessage
                            ? `${lastMessage.direction === "outbound" ? "You: " : ""}${lastMessage.body}`
                            : "No messages"
                        }
                    </p>
                    {hasUnread && (
                        <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    channelFilter,
    onChannelFilterChange,
    channelCounts,
    searchQuery,
    onSearchChange,
    viewFilter,
    onViewFilterChange,
}: ConversationListProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 shrink-0 space-y-2.5">
                {/* Title + View toggle */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[18px] font-bold">Chats</h2>
                    <div className="flex items-center bg-slate-100/80 dark:bg-neutral-800 rounded-lg p-0.5">
                        <button
                            onClick={() => onViewFilterChange("inbox")}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                                viewFilter === "inbox"
                                    ? "bg-white dark:bg-neutral-700 text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Inbox className="h-3 w-3" />
                            Inbox
                        </button>
                        <button
                            onClick={() => onViewFilterChange("archived")}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                                viewFilter === "archived"
                                    ? "bg-white dark:bg-neutral-700 text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Archive className="h-3 w-3" />
                            Archived
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search Messenger"
                        className="w-full h-9 pl-10 pr-8 text-[13px] rounded-full bg-[#f0f0f0] dark:bg-neutral-800 border-0 placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-300 dark:bg-neutral-600 flex items-center justify-center hover:bg-slate-400"
                        >
                            <X className="h-3 w-3 text-white" />
                        </button>
                    )}
                </div>

                {/* Channel filters */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                    {FILTERS.map((f) => {
                        const count = channelCounts[f.key] ?? 0
                        const active = channelFilter === f.key
                        return (
                            <button
                                key={f.key}
                                onClick={() => onChannelFilterChange(f.key)}
                                className={cn(
                                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all",
                                    active
                                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                                        : "bg-[#f0f0f0] dark:bg-neutral-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-neutral-700"
                                )}
                            >
                                {f.label}
                                <span className={cn("tabular-nums text-[10px]", active ? "opacity-80" : "opacity-40")}>{count}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <MessageSquare className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/70">
                            {searchQuery ? "No results" : viewFilter === "archived" ? "No archived chats" : "No conversations"}
                        </p>
                        <p className="text-xs text-muted-foreground/40 mt-1 max-w-[200px]">
                            {searchQuery ? "Try a different search." : "New messages will appear here."}
                        </p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <ConversationRow
                            key={conv.id}
                            conv={conv}
                            isSelected={conv.id === selectedId}
                            onSelect={onSelect}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
