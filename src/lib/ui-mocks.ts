export const MOCK_CLIENTS = [
  {
    id: "client-1",
    firstName: "Ava",
    lastName: "Martinez",
    email: "ava@example.com",
    phone: "+1 305 555 0112",
  },
  {
    id: "client-2",
    firstName: "Noah",
    lastName: "Lee",
    email: "noah@example.com",
    phone: "+1 786 555 0134",
  },
] as const

export const MOCK_LEADS = [
  {
    id: "lead-1",
    firstName: "Sofia",
    lastName: "Clark",
  },
  {
    id: "lead-2",
    firstName: "Ethan",
    lastName: "Wright",
  },
] as const

export const MOCK_APPOINTMENTS = [
  {
    id: "apt-1",
    title: "Haircut + Styling",
    description: "First-time client consultation",
    startTime: "2026-02-22T15:00:00.000Z",
    endTime: "2026-02-22T16:00:00.000Z",
    status: "SCHEDULED",
    clientName: "Ava Martinez",
    clientId: "client-1",
    leadName: null,
    leadId: null,
    userName: "Demo User",
  },
  {
    id: "apt-2",
    title: "Color Touch-up",
    description: null,
    startTime: "2026-02-23T18:00:00.000Z",
    endTime: "2026-02-23T18:45:00.000Z",
    status: "SCHEDULED",
    clientName: "Noah Lee",
    clientId: "client-2",
    leadName: null,
    leadId: null,
    userName: "Demo User",
  },
] as const

export const MOCK_SETTINGS = {
  id: "ui-only-user",
  name: "Demo User",
  email: "demo@local.crm",
  role: "ADMIN",
  tenantId: "ui-only-tenant",
  tenant: { name: "Demo Studio" },
  accounts: [],
  metaPage: null,
} as const

export const MOCK_DASHBOARD_STATS = {
  leads: 8,
  clients: 24,
  appointments: 6,
} as const
