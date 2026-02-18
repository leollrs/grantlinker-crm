"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteButtonProps {
    id: string
    deleteAction: (id: string) => Promise<void>
}

export function DeleteButton({ id, deleteAction }: DeleteButtonProps) {
    const [isPending, startTransition] = useTransition()

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
            disabled={isPending}
            onClick={() => {
                if (confirm("Are you sure you want to delete this item?")) {
                    startTransition(async () => {
                        await deleteAction(id)
                    })
                }
            }}
        >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
        </Button>
    )
}
