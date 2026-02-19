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

export type HideableNavPage = Extract<(typeof NAV_PAGES)[number], { hideable: true }>
export type HideableNavPageId = HideableNavPage["id"]

function isHideablePage(page: (typeof NAV_PAGES)[number]): page is HideableNavPage {
  return page.hideable
}

export const HIDEABLE_NAV_PAGES = NAV_PAGES.filter(isHideablePage)

export const DEFAULT_VISIBLE_PAGE_IDS: HideableNavPageId[] = HIDEABLE_NAV_PAGES.map(
  (page) => page.id
)
