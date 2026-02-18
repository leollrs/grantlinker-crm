"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/common/DeleteButton"
import { deleteLead } from "@/lib/actions/leads"
import { ChevronRight, ArrowUpDown, Filter, X } from "lucide-react"

interface Lead {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    status: string
    whatsappNumber: string | null
    instagramUsername: string | null
    messengerId: string | null
    createdAt: string
}

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"
type ChannelFilter = "all" | "sms" | "whatsapp" | "instagram" | "facebook"

function getLeadChannel(lead: Lead): string {
    if (lead.instagramUsername) return "instagram"
    if (lead.messengerId) return "facebook"
    if (lead.whatsappNumber) return "whatsapp"
    if (lead.phone) return "sms"
    return "unknown"
}

function getChannelLabel(channel: string): string {
    switch (channel) {
        case "sms": return "SMS"
        case "whatsapp": return "WhatsApp"
        case "instagram": return "Instagram"
        case "facebook": return "Facebook"
        default: return "—"
    }
}

const statusBadge: Record<string, string> = {
    NEW: "badge-new",
    CONTACTED: "badge-contacted",
    QUALIFIED: "badge-qualified",
    WON: "badge-won",
    LOST: "badge-lost",
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`badge ${statusBadge[status] || "badge-new"}`}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    )
}

function ChannelBadge({ channel }: { channel: string }) {
    const colors: Record<string, string> = {
        sms: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        whatsapp: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
        instagram: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
        facebook: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
        unknown: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400",
    }
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[channel] || colors.unknown}`}>
            {getChannelLabel(channel)}
        </span>
    )
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
    const [sort, setSort] = useState<SortOption>("newest")
    const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all")
    const [showFilters, setShowFilters] = useState(false)

    const filtered = useMemo(() => {
        let result = [...leads]

        // Channel filter
        if (channelFilter !== "all") {
            result = result.filter((l) => getLeadChannel(l) === channelFilter)
        }

        // Sort
        result.sort((a, b) => {
            switch (sort) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case "name-asc":
                    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                case "name-desc":
                    return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
                default:
                    return 0
            }
        })

        return result
    }, [leads, sort, channelFilter])

    const hasActiveFilter = channelFilter !== "all"

    return (
        <>
            {/* Filter/Sort bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant={showFilters ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-1.5 h-8"
                >
                    <Filter className="h-3.5 w-3.5" />
                    Filter
                    {hasActiveFilter && (
                        <span className="ml-1 rounded-full bg-primary text-primary-foreground h-4 w-4 text-[10px] flex items-center justify-center">1</span>
                    )}
                </Button>

                <div className="flex items-center gap-1 ml-auto">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortOption)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                    </select>
                </div>
            </div>

            {/* Filter chips */}
            {showFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Channel:</span>
                    {(["all", "sms", "whatsapp", "instagram", "facebook"] as const).map((ch) => (
                        <button
                            key={ch}
                            onClick={() => setChannelFilter(ch)}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${channelFilter === ch
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {ch === "all" ? "All" : getChannelLabel(ch)}
                        </button>
                    ))}
                    {hasActiveFilter && (
                        <button
                            onClick={() => setChannelFilter("all")}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </button>
                    )}
                </div>
            )}

            {/* Results count */}
            {hasActiveFilter && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {leads.length} leads
                </p>
            )}

            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {hasActiveFilter
                            ? "No leads match the current filter."
                            : "No leads yet. Create your first lead to get started."}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="space-y-3 md:hidden">
                        {filtered.map((lead) => (
                            <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="block">
                                <Card className="active:scale-[0.99] transition-transform duration-150">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-sm truncate">{lead.firstName} {lead.lastName}</p>
                                                    <StatusBadge status={lead.status} />
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <ChannelBadge channel={getLeadChannel(lead)} />
                                                    <span className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <Card className="hidden md:block">
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="h-11 px-4 text-left font-medium text-muted-foreground">Name</th>
                                            <th className="h-11 px-4 text-left font-medium text-muted-foreground">Email</th>
                                            <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                                            <th className="h-11 px-4 text-left font-medium text-muted-foreground">Channel</th>
                                            <th className="h-11 px-4 text-left font-medium text-muted-foreground">Status</th>
                                            <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                                            <th className="h-11 px-4 text-right font-medium text-muted-foreground w-28"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((lead) => (
                                            <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150">
                                                <td className="px-4 py-3">
                                                    <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:text-primary transition-colors duration-150">
                                                        {lead.firstName} {lead.lastName}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                                                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{lead.phone || "\u2014"}</td>
                                                <td className="px-4 py-3">
                                                    <ChannelBadge channel={getLeadChannel(lead)} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={lead.status} />
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/dashboard/leads/${lead.id}`}>
                                                            <Button variant="ghost" size="sm">View</Button>
                                                        </Link>
                                                        <DeleteButton id={lead.id} deleteAction={deleteLead} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </>
    )
}
