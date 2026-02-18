"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

interface EditContactModalProps {
    conversationId: string
    displayName: string
    notes: string
    open: boolean
    onClose: () => void
    onSaved: () => void
}

export function EditContactModal({ conversationId, displayName: initialName, notes: initialNotes, open, onClose, onSaved }: EditContactModalProps) {
    const [displayName, setDisplayName] = useState(initialName)
    const [notes, setNotes] = useState(initialNotes)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setDisplayName(initialName)
            setNotes(initialNotes)
        }
    }, [open, initialName, initialNotes])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/conversations/${conversationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName: displayName.trim(), notes: notes.trim() }),
            })
            if (res.ok) {
                onSaved()
                onClose()
            }
        } catch { }
        setSaving(false)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold">Edit Contact</h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Contact name..."
                            className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this contact..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="h-9 px-4 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-9 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}
