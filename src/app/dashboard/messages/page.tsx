import { redirect } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { UI_ONLY_MODE } from "@/lib/ui-only-mode"

export default function MessagesPage() {
  if (UI_ONLY_MODE) {
    return (
      <div className="flex-1 min-w-0 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Messages</h2>
          <p className="text-sm text-muted-foreground mt-1">Conversation center preview.</p>
        </div>

        <div className="max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">UI-only mode enabled</p>
          <p className="text-sm text-muted-foreground mt-1">
            Inbox data is disabled until database connection is restored.
          </p>
        </div>
      </div>
    )
  }

  redirect("/dashboard/inbox")
}
