"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateLead, convertLeadToClient, linkLeadToClient } from "@/lib/actions/leads"
import { Pencil, X, Loader2, UserCheck, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"

interface LeadData {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    address: string | null
    companyName: string | null
    status: string
    value: number | null
    convertedClientId: string | null
    createdAt: string
}

const statusOptions = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]

export function LeadDetailsCard({ lead }: { lead: LeadData }) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; msg: string } | null>(null)

    // Convert flow state
    const [showConvert, setShowConvert] = useState(false)
    const [convertPending, setConvertPending] = useState(false)
    const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null)

    const [form, setForm] = useState({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || "",
        address: lead.address || "",
        companyName: lead.companyName || "",
        status: lead.status,
        value: lead.value?.toString() || "",
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    function showToast(type: "success" | "error" | "warning", msg: string) {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 4000)
    }

    function validate() {
        const e: Record<string, string> = {}
        if (!form.firstName.trim()) e.firstName = "Required"
        if (!form.lastName.trim()) e.lastName = "Required"
        if (!form.email.trim()) e.email = "Required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email"
        if (form.phone && !/^[+\d\s()-]*$/.test(form.phone)) e.phone = "Invalid phone"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    function handleCancel() {
        setForm({
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone || "",
            address: lead.address || "",
            companyName: lead.companyName || "",
            status: lead.status,
            value: lead.value?.toString() || "",
        })
        setErrors({})
        setEditing(false)
    }

    function handleSave() {
        if (!validate()) return
        startTransition(async () => {
            const result = await updateLead(lead.id, {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
                address: form.address.trim() || undefined,
                companyName: form.companyName.trim() || undefined,
                status: form.status,
                value: form.value ? parseFloat(form.value) : undefined,
            })
            if (result?.error) {
                showToast("error", result.error)
            } else {
                showToast("success", "Lead updated")
                setEditing(false)
            }
        })
    }

    async function handleConvert(force = false) {
        setConvertPending(true)
        const result = await convertLeadToClient(lead.id, force)
        setConvertPending(false)

        if (result?.error === "duplicate" && result.existingClient) {
            setDuplicate(result.existingClient)
            return
        }
        if (result?.error) {
            showToast("error", result.error)
            setShowConvert(false)
            return
        }
        if (result?.clientId) {
            router.push(`/dashboard/clients/${result.clientId}`)
        }
    }

    async function handleLinkToExisting() {
        if (!duplicate) return
        setConvertPending(true)
        const result = await linkLeadToClient(lead.id, duplicate.id)
        setConvertPending(false)

        if (result?.error) {
            showToast("error", result.error)
        } else if (result?.clientId) {
            router.push(`/dashboard/clients/${result.clientId}`)
        }
        setDuplicate(null)
        setShowConvert(false)
    }

    const statusBadge: Record<string, string> = {
        NEW: "badge-new",
        CONTACTED: "badge-contacted",
        QUALIFIED: "badge-qualified",
        WON: "badge-won",
        LOST: "badge-lost",
    }

    const isConverted = lead.status === "WON" && !!lead.convertedClientId

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                    <CardTitle>Lead Details</CardTitle>
                    <span className={`badge ${statusBadge[lead.status] || "badge-new"}`}>
                        {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
                    </span>
                </div>
                {!editing && !showConvert && (
                    <div className="flex items-center gap-1.5">
                        {!isConverted && (
                            <Button variant="outline" size="sm" onClick={() => setShowConvert(true)} className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                <UserCheck className="h-3.5 w-3.5" />
                                Convert to Client
                            </Button>
                        )}
                        {isConverted && lead.convertedClientId && (
                            <Link href={`/dashboard/clients/${lead.convertedClientId}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View Client
                                </Button>
                            </Link>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-muted-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {toast && (
                    <div className={`mb-4 text-sm px-3 py-2 rounded-md ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : toast.type === "warning" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
                        {toast.msg}
                    </div>
                )}

                {/* Converted banner */}
                {isConverted && (
                    <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-400">This lead has been converted to a client.</p>
                    </div>
                )}

                {/* Convert confirmation */}
                {showConvert && !duplicate && (
                    <div className="mb-4 p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
                        <p className="text-sm font-medium mb-3">Convert this lead to a client?</p>
                        <p className="text-xs text-muted-foreground mb-3">This will create a client profile and keep the lead as converted.</p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleConvert()} disabled={convertPending} className="gap-1.5">
                                {convertPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Confirm
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowConvert(false)} disabled={convertPending}>Cancel</Button>
                        </div>
                    </div>
                )}

                {/* Duplicate warning */}
                {duplicate && (
                    <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                        <p className="text-sm font-medium mb-1">Possible duplicate client found</p>
                        <p className="text-xs text-muted-foreground mb-3">A client named <strong>{duplicate.name}</strong> with the same email or phone already exists.</p>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={handleLinkToExisting} disabled={convertPending} className="gap-1.5">
                                {convertPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <ArrowRight className="h-3.5 w-3.5" />
                                Link to {duplicate.name}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleConvert(true)} disabled={convertPending} className="gap-1.5">
                                {convertPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Create anyway
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setDuplicate(null); setShowConvert(false) }}>Cancel</Button>
                        </div>
                    </div>
                )}

                {editing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="companyName">Company</Label>
                                <Input id="companyName" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {statusOptions.map((s) => (
                                        <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="value">Value ($)</Label>
                            <Input id="value" type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Button size="sm" onClick={handleSave} disabled={isPending}>
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
                                <X className="h-3.5 w-3.5 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <dl className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Name</dt>
                            <dd className="col-span-2 font-medium">{lead.firstName} {lead.lastName}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Email</dt>
                            <dd className="col-span-2 font-medium">{lead.email || "\u2014"}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Phone</dt>
                            <dd className="col-span-2 font-medium">{lead.phone || "\u2014"}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Address</dt>
                            <dd className="col-span-2 font-medium">{lead.address || "\u2014"}</dd>
                        </div>
                        {lead.companyName && (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <dt className="text-muted-foreground">Company</dt>
                                <dd className="col-span-2 font-medium">{lead.companyName}</dd>
                            </div>
                        )}
                        {lead.value !== null && (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <dt className="text-muted-foreground">Value</dt>
                                <dd className="col-span-2 font-medium">${Number(lead.value).toFixed(2)}</dd>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Added</dt>
                            <dd className="col-span-2 font-medium">{new Date(lead.createdAt).toLocaleDateString()}</dd>
                        </div>
                    </dl>
                )}
            </CardContent>
        </Card>
    )
}
