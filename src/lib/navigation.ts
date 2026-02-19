export const NAV_PAGES = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", hideable: true },
  { id: "leads", label: "Leads", href: "/dashboard/leads", hideable: true },
  { id: "clients", label: "Clients", href: "/dashboard/clients", hideable: true },
  { id: "appointments", label: "Appointments", href: "/dashboard/appointments", hideable: true },
  { id: "calendar", label: "Calendar", href: "/dashboard/calendar", hideable: true },
  { id: "inbox", label: "Inbox", href: "/dashboard/inbox", hideable: true },
  { id: "settings", label: "Settings", href: "/dashboard/settings", hideable: false },
] as const

export type NavPageId = (typeof NAV_PAGES)[number]["id"]

export const HIDEABLE_NAV_PAGES = NAV_PAGES.filter((page) => page.hideable)

export const DEFAULT_VISIBLE_PAGE_IDS = HIDEABLE_NAV_PAGES.map(
  (page) => page.id
) as NavPageId[]
