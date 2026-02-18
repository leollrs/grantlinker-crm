"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import {
    ArrowLeft, Send, Loader2, Link2, Pencil, Archive, ArchiveRestore,
    Trash2, AlertCircle, Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LinkContactModal } from "./modals/LinkContactModal"
import { EditContactModal } from "./modals/EditContactModal"
import { ConfirmDeleteModal } from "./modals/ConfirmDeleteModal"

interface Message {
    id: string
    body: string
    direction: string
    status: string
    createdAt: string | Date
}

interface ConversationData {
    id: string
    phoneNumber: string
    channel: string
    status: string
    displayName: string | null
    notes: string | null
    client: { id: string; firstName: string; lastName: string; phone: string | null; email: string } | null
    lead: { id: string; firstName: string; lastName: string; phone: string | null; email: string } | null
    messages: Message[]
}

interface ChatPanelProps {
    conversationId: string
    onBack: () => void
    onConversationUpdated?: () => void
}

/* ─── Helpers ─── */

function getContactName(conv: ConversationData): string {
    return conv.displayName
        || (conv.client ? `${conv.client.firstName} ${conv.client.lastName}` : "")
        || (conv.lead ? `${conv.lead.firstName} ${conv.lead.lastName}` : "")
        || conv.phoneNumber
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0]?.[0]?.toUpperCase() || "#"
}

/* ─── Channel pill ─── */
function ChannelPill({ channel }: { channel: string }) {
    const config: Record<string, { label: string; cls: string }> = {
        whatsapp: { label: "WhatsApp", cls: "text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400" },
        instagram: { label: "Instagram", cls: "text-pink-700 bg-pink-50 dark:bg-pink-950 dark:text-pink-400" },
        facebook: { label: "Messenger", cls: "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
        sms: { label: "SMS", cls: "text-slate-600 bg-slate-100 dark:bg-neutral-800 dark:text-neutral-400" },
    }
    const c = config[channel]
    if (!c) return null
    return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none", c.cls)}>{c.label}</span>
}

/* ─── Day separator ─── */
function DaySeparator({ date }: { date: Date }) {
    let label: string
    if (isToday(date)) label = "Today"
    else if (isYesterday(date)) label = "Yesterday"
    else label = format(date, "EEEE, MMM d")

    return (
        <div className="flex justify-center my-6">
            <span className="text-[11px] text-muted-foreground/60 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm px-4 py-1 rounded-full font-medium shadow-sm border border-border/30">
                {label}
            </span>
        </div>
    )
}

/* ─── Message bubble (Messenger style) ─── */
function MessageBubble({
    msg,
    isFirstInGroup,
    isLastInGroup,
    contactInitials,
}: {
    msg: Message
    isFirstInGroup: boolean
    isLastInGroup: boolean
    contactInitials: string
}) {
    const isOutbound = msg.direction === "outbound"
    const isFailed = msg.status === "failed"

    // Messenger-style radius: rounded on all corners, but flat on the side that continues
    const inboundRadius = isFirstInGroup && isLastInGroup
        ? "rounded-[20px] rounded-bl-[6px]"
        : isFirstInGroup
            ? "rounded-[20px] rounded-bl-[6px] rounded-bl-[6px]"
            : isLastInGroup
                ? "rounded-[20px] rounded-tl-[6px] rounded-bl-[6px]"
                : "rounded-[20px] rounded-l-[6px]"

    const outboundRadius = isFirstInGroup && isLastInGroup
        ? "rounded-[20px] rounded-br-[6px]"
        : isFirstInGroup
            ? "rounded-[20px] rounded-br-[6px]"
            : isLastInGroup
                ? "rounded-[20px] rounded-tr-[6px] rounded-br-[6px]"
                : "rounded-[20px] rounded-r-[6px]"

    return (
        <div className={cn(
            "flex items-end gap-2",
            isOutbound ? "justify-end" : "justify-start",
            isLastInGroup ? "mb-3" : "mb-[3px]"
        )}>
            {/* Inbound avatar — only show on last message in group */}
            {!isOutbound && (
                <div className="w-8 shrink-0">
                    {isLastInGroup && (
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-neutral-400">
                            {contactInitials}
                        </div>
                    )}
                </div>
            )}

            <div className={cn("max-w-[70%]", isOutbound ? "" : "")}>
                <div className={cn(
                    "px-[14px] py-[10px] text-[14px] leading-[1.45]",
                    isOutbound
                        ? isFailed
                            ? cn("bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200/80 dark:border-red-800/40", outboundRadius)
                            : cn("bg-primary text-primary-foreground", outboundRadius)
                        : cn("bg-[#f0f0f0] dark:bg-neutral-800 text-foreground", inboundRadius)
                )}>
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                </div>

                {/* Timestamp — only on last in group */}
                {isLastInGroup && (
                    <div className={cn(
                        "flex items-center gap-1.5 mt-1 px-1",
                        isOutbound ? "justify-end" : "justify-start"
                    )}>
                        <span className="text-[10px] text-muted-foreground/40 font-medium">
                            {format(new Date(msg.createdAt), "h:mm a")}
                        </span>
                        {isFailed && (
                            <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-semibold">
                                <AlertCircle className="h-3 w-3" />
                                Failed
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Composer ─── */
function Composer({ onSend, sending }: { onSend: (text: string) => void; sending: boolean }) {
    const [text, setText] = useState("")
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
        if (!text.trim() || sending) return
        onSend(text.trim())
        setText("")
        if (inputRef.current) inputRef.current.style.height = "44px"
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    useEffect(() => { inputRef.current?.focus() }, [])

    return (
        <div className="shrink-0 bg-white dark:bg-neutral-900 border-t border-border/40 px-4 py-3">
            <div className="flex items-end gap-2">
                <button
                    type="button"
                    className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-muted-foreground/40 hover:text-muted-foreground hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Attachments"
                >
                    <Paperclip className="h-5 w-5" />
                </button>

                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Aa"
                    disabled={sending}
                    rows={1}
                    className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 rounded-[20px] bg-[#f0f0f0] dark:bg-neutral-800 border-0 text-[14px] placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50 resize-none leading-[1.45]"
                    style={{ height: "40px" }}
                    onInput={(e) => {
                        const t = e.target as HTMLTextAreaElement
                        t.style.height = "40px"
                        t.style.height = Math.min(t.scrollHeight, 120) + "px"
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90",
                        text.trim()
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground/25"
                    )}
                >
                    {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    )
}

/* ─── Action Button ─── */
function ActionButton({
    icon: Icon,
    label,
    onClick,
    destructive,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    destructive?: boolean
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                destructive
                    ? "text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                    : "text-muted-foreground/50 hover:text-foreground hover:bg-slate-100 dark:hover:bg-neutral-800"
            )}
        >
            <Icon className="h-[18px] w-[18px]" />
        </button>
    )
}

/* ═══════════════════════════════════════════ */
/* ─── ChatPanel ─── */
/* ═══════════════════════════════════════════ */

export function ChatPanel({ conversationId, onBack, onConversationUpdated }: ChatPanelProps) {
    const [conversation, setConversation] = useState<ConversationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [linkOpen, setLinkOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const fetchConversation = useCallback(async () => {
        try {
            const res = await fetch(`/api/conversations/${conversationId}`)
            if (res.ok) setConversation(await res.json())
        } catch (err) {
            console.error("Failed to fetch conversation:", err)
        } finally {
            setLoading(false)
        }
    }, [conversationId])

    useEffect(() => {
        setLoading(true)
        fetchConversation()
    }, [fetchConversation])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [conversation?.messages])

    const handleSend = async (text: string) => {
        setSending(true)
        try {
            const res = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, body: text }),
            })
            if (res.ok) {
                await fetchConversation()
                onConversationUpdated?.()
            }
        } catch (err) {
            console.error("Failed to send message:", err)
        } finally {
            setSending(false)
        }
    }

    const handleArchiveToggle = async () => {
        if (!conversation) return
        const newStatus = conversation.status === "archived" ? "active" : "archived"
        try {
            const res = await fetch(`/api/conversations/${conversationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
                await fetchConversation()
                onConversationUpdated?.()
            }
        } catch { }
    }

    const handleUpdated = () => {
        fetchConversation()
        onConversationUpdated?.()
    }

    const handleDeleted = () => {
        onConversationUpdated?.()
        onBack()
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-neutral-950">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
            </div>
        )
    }

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground bg-white dark:bg-neutral-950">
                Conversation not found
            </div>
        )
    }

    const contactName = getContactName(conversation)
    const contactInitials = getInitials(contactName)

    const linkedTo = conversation.client
        ? { type: "Client" as const, name: `${conversation.client.firstName} ${conversation.client.lastName}` }
        : conversation.lead
            ? { type: "Lead" as const, name: `${conversation.lead.firstName} ${conversation.lead.lastName}` }
            : null

    // Pre-compute bubble grouping
    const messages = conversation.messages
    const groupInfo = messages.map((msg, i) => {
        const prev = i > 0 ? messages[i - 1] : null
        const next = i < messages.length - 1 ? messages[i + 1] : null
        const sameAsPrev = prev?.direction === msg.direction
        const sameAsNext = next?.direction === msg.direction

        // Break group if time gap > 2 minutes
        const prevTime = prev ? new Date(prev.createdAt).getTime() : 0
        const nextTime = next ? new Date(next.createdAt).getTime() : 0
        const msgTime = new Date(msg.createdAt).getTime()
        const prevClose = prev && (msgTime - prevTime < 2 * 60 * 1000)
        const nextClose = next && (nextTime - msgTime < 2 * 60 * 1000)

        return {
            isFirstInGroup: !(sameAsPrev && prevClose),
            isLastInGroup: !(sameAsNext && nextClose),
        }
    })

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
            {/* ─── Chat Header ─── */}
            <div className="shrink-0 bg-white dark:bg-neutral-900 border-b border-border/40 px-4 h-[65px] flex items-center">
                <div className="flex items-center gap-3 w-full">
                    {/* Mobile back */}
                    <button
                        onClick={onBack}
                        className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-[13px] font-bold text-primary">
                        {contactInitials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold truncate leading-tight">{contactName}</h3>
                            <ChannelPill channel={conversation.channel} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[12px] text-muted-foreground/60">{conversation.phoneNumber}</span>
                            {linkedTo && (
                                <>
                                    <span className="text-[12px] text-muted-foreground/20">&middot;</span>
                                    <span className={cn(
                                        "text-[11px] font-medium",
                                        linkedTo.type === "Client" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                    )}>
                                        {linkedTo.type}: {linkedTo.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <ActionButton icon={Pencil} label="Edit" onClick={() => setEditOpen(true)} />
                        <ActionButton icon={Link2} label="Link" onClick={() => setLinkOpen(true)} />
                        <ActionButton
                            icon={conversation.status === "archived" ? ArchiveRestore : Archive}
                            label={conversation.status === "archived" ? "Unarchive" : "Archive"}
                            onClick={handleArchiveToggle}
                        />
                        <ActionButton icon={Trash2} label="Delete" onClick={() => setDeleteOpen(true)} destructive />
                    </div>
                </div>
            </div>

            {/* ─── Messages ─── */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-950">
                <div className="px-4 py-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-slate-300 dark:text-neutral-600">{contactInitials}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground/70">{contactName}</p>
                            <p className="text-xs text-muted-foreground/50 mt-1">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => {
                                const msgDate = new Date(msg.createdAt)
                                const prevMsg = i > 0 ? messages[i - 1] : null
                                const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null
                                const showDay = !prevDate || !isSameDay(msgDate, prevDate)

                                return (
                                    <div key={msg.id}>
                                        {showDay && <DaySeparator date={msgDate} />}
                                        <MessageBubble
                                            msg={msg}
                                            isFirstInGroup={groupInfo[i].isFirstInGroup}
                                            isLastInGroup={groupInfo[i].isLastInGroup}
                                            contactInitials={contactInitials}
                                        />
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            </div>

            {/* ─── Composer ─── */}
            <Composer onSend={handleSend} sending={sending} />

            {/* ─── Modals ─── */}
            <LinkContactModal
                conversationId={conversationId}
                open={linkOpen}
                onClose={() => setLinkOpen(false)}
                onLinked={handleUpdated}
            />
            <EditContactModal
                conversationId={conversationId}
                displayName={conversation.displayName || contactName}
                notes={conversation.notes || ""}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onSaved={handleUpdated}
            />
            <ConfirmDeleteModal
                conversationId={conversationId}
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onDeleted={handleDeleted}
            />
        </div>
    )
}
