"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, MessageSquare, Mail, Instagram, Facebook, Pencil, X, Loader2, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateLeadChannels } from "@/lib/actions/leads"
import { updateClientChannels } from "@/lib/actions/clients"

export interface ChannelFields {
    phone: string | null
    email: string
    whatsappNumber: string | null
    instagramUsername: string | null
    messengerId: string | null
}

interface ContactActionsCardProps {
    entityId: string
    entityType: "lead" | "client"
    channels: ChannelFields
    conversationChannels?: string[]
}

export function ContactActionsCard({ entityId, entityType, channels, conversationChannels = [] }: ContactActionsCardProps) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

    const [form, setForm] = useState({
        phone: channels.phone || "",
        email: channels.email,
        whatsappNumber: channels.whatsappNumber || "",
        instagramUsername: channels.instagramUsername || "",
        messengerId: channels.messengerId || "",
    })

    function handleCancel() {
        setForm({
            phone: channels.phone || "",
            email: channels.email,
            whatsappNumber: channels.whatsappNumber || "",
            instagramUsername: channels.instagramUsername || "",
            messengerId: channels.messengerId || "",
        })
        setEditing(false)
    }

    function handleSave() {
        startTransition(async () => {
            const data = {
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                whatsappNumber: form.whatsappNumber.trim() || undefined,
                instagramUsername: form.instagramUsername.trim() || undefined,
                messengerId: form.messengerId.trim() || undefined,
            }

            const result = entityType === "lead"
                ? await updateLeadChannels(entityId, data)
                : await updateClientChannels(entityId, data)

            if (result?.error) {
                setToast({ type: "error", msg: result.error })
            } else {
                setToast({ type: "success", msg: "Channels updated" })
                setEditing(false)
            }
            setTimeout(() => setToast(null), 3000)
        })
    }

    // Resolve effective values (form values in edit mode, saved values otherwise)
    const effective = editing ? form : {
        phone: channels.phone || "",
        email: channels.email,
        whatsappNumber: channels.whatsappNumber || "",
        instagramUsername: channels.instagramUsername || "",
        messengerId: channels.messengerId || "",
    }

    const actions = [
        {
            key: "call",
            label: "Call",
            icon: Phone,
            color: "text-emerald-600",
            bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
            enabled: !!effective.phone,
            onClick: () => effective.phone && window.open(`tel:${effective.phone}`, "_self"),
        },
        {
            key: "sms",
            label: "Text",
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
            enabled: !!effective.phone,
            onClick: () => effective.phone && window.open(`sms:${effective.phone}`, "_self"),
        },
        {
            key: "email",
            label: "Email",
            icon: Mail,
            color: "text-amber-600",
            bg: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
            enabled: !!effective.email,
            onClick: () => effective.email && window.open(`mailto:${effective.email}`, "_self"),
        },
        {
            key: "whatsapp",
            label: "WhatsApp",
            icon: MessageSquare,
            color: "text-green-600",
            bg: "hover:bg-green-50 dark:hover:bg-green-950/30",
            enabled: !!(effective.whatsappNumber || effective.phone),
            onClick: () => {
                const num = effective.whatsappNumber || effective.phone
                if (num) {
                    const digits = num.replace(/[^\d]/g, "")
                    window.open(`https://wa.me/${digits}`, "_blank")
                }
            },
        },
        {
            key: "instagram",
            label: "Instagram",
            icon: Instagram,
            color: "text-pink-600",
            bg: "hover:bg-pink-50 dark:hover:bg-pink-950/30",
            enabled: !!effective.instagramUsername || conversationChannels.includes("instagram"),
            onClick: () => {
                if (conversationChannels.includes("instagram")) {
                    router.push(`/dashboard/inbox?channel=instagram`)
                } else if (effective.instagramUsername) {
                    window.open(`https://instagram.com/${effective.instagramUsername}`, "_blank")
                }
            },
        },
        {
            key: "messenger",
            label: "Messenger",
            icon: Facebook,
            color: "text-blue-500",
            bg: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
            enabled: !!effective.messengerId || conversationChannels.includes("facebook"),
            onClick: () => {
                if (conversationChannels.includes("facebook")) {
                    router.push(`/dashboard/inbox?channel=facebook`)
                } else if (effective.messengerId) {
                    window.open(`https://m.me/${effective.messengerId}`, "_blank")
                }
            },
        },
    ]

    const fields = [
        { key: "phone", label: "Phone", value: effective.phone, placeholder: "+1 787 555 0100" },
        { key: "email", label: "Email", value: effective.email, placeholder: "email@example.com" },
        { key: "whatsappNumber", label: "WhatsApp", value: effective.whatsappNumber, placeholder: "+1 787 555 0100" },
        { key: "instagramUsername", label: "Instagram", value: effective.instagramUsername, placeholder: "@username" },
        { key: "messengerId", label: "Messenger", value: effective.messengerId, placeholder: "Facebook Page ID or username" },
    ]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Contact</CardTitle>
                {!editing && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-muted-foreground h-8">
                        <Pencil className="h-3 w-3" />
                        Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {toast && (
                    <div className={`mb-3 text-xs px-3 py-2 rounded-md ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
                        {toast.msg}
                    </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {actions.map((action) => (
                        <button
                            key={action.key}
                            onClick={action.onClick}
                            disabled={!action.enabled || editing}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-center transition-colors ${action.bg} ${(!action.enabled || editing) ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                            <action.icon className={`h-5 w-5 ${action.enabled ? action.color : "text-muted-foreground"}`} />
                            <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Channel fields */}
                <div className="border-t pt-4 space-y-3">
                    {editing ? (
                        <>
                            {fields.map((field) => (
                                <div key={field.key} className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                                    <Input
                                        value={(form as any)[field.key]}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            ))}
                            <div className="flex items-center gap-2 pt-2">
                                <Button size="sm" onClick={handleSave} disabled={isPending} className="h-8 gap-1.5">
                                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending} className="h-8 gap-1">
                                    <X className="h-3 w-3" />
                                    Cancel
                                </Button>
                            </div>
                        </>
                    ) : (
                        fields.map((field) => (
                            <div key={field.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground text-xs">{field.label}</span>
                                <span className="font-medium text-xs truncate ml-4 max-w-[160px]">
                                    {field.value || "\u2014"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
