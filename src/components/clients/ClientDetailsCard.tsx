"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateClient } from "@/lib/actions/clients"
import { Pencil, X, Loader2 } from "lucide-react"

interface ClientData {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    address: string | null
    createdAt: string
}

export function ClientDetailsCard({ client }: { client: ClientData }) {
    const [editing, setEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

    const [form, setForm] = useState({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone || "",
        address: client.address || "",
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

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
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone || "",
            address: client.address || "",
        })
        setErrors({})
        setEditing(false)
    }

    function handleSave() {
        if (!validate()) return
        startTransition(async () => {
            const result = await updateClient(client.id, {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
                address: form.address.trim() || undefined,
            })
            if (result?.error) {
                setToast({ type: "error", msg: result.error })
            } else {
                setToast({ type: "success", msg: "Client updated" })
                setEditing(false)
            }
            setTimeout(() => setToast(null), 3000)
        })
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Client Details</CardTitle>
                {!editing && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {toast && (
                    <div className={`mb-4 text-sm px-3 py-2 rounded-md ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
                        {toast.msg}
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
                            <dd className="col-span-2 font-medium">{client.firstName} {client.lastName}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Email</dt>
                            <dd className="col-span-2 font-medium">{client.email}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Phone</dt>
                            <dd className="col-span-2 font-medium">{client.phone || "\u2014"}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Address</dt>
                            <dd className="col-span-2 font-medium">{client.address || "\u2014"}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <dt className="text-muted-foreground">Added</dt>
                            <dd className="col-span-2 font-medium">{new Date(client.createdAt).toLocaleDateString()}</dd>
                        </div>
                    </dl>
                )}
            </CardContent>
        </Card>
    )
}
