"use client"

import { useState } from "react"
import { X, Loader2, AlertTriangle } from "lucide-react"

interface ConfirmDeleteModalProps {
    conversationId: string
    open: boolean
    onClose: () => void
    onDeleted: () => void
}

export function ConfirmDeleteModal({ conversationId, open, onClose, onDeleted }: ConfirmDeleteModalProps) {
    const [confirmText, setConfirmText] = useState("")
    const [deleting, setDeleting] = useState(false)

    const canDelete = confirmText === "DELETE"

    const handleDelete = async () => {
        if (!canDelete) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/conversations/${conversationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "deleted" }),
            })
            if (res.ok) {
                onDeleted()
                onClose()
            }
        } catch { }
        setDeleting(false)
    }

    const handleClose = () => {
        setConfirmText("")
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-border">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Delete Conversation
                    </h3>
                    <button onClick={handleClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This will remove the conversation from your inbox. This action cannot be easily undone.
                    </p>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Type <span className="font-bold text-foreground">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
                    <button
                        onClick={handleClose}
                        className="h-9 px-4 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!canDelete || deleting}
                        className="h-9 px-4 text-sm font-medium rounded-lg bg-destructive text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
