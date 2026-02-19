import { Pool } from "pg"
import { randomUUID } from "crypto"

type PlainObject = Record<string, any>

type QueryArgs = {
  where?: PlainObject
  include?: PlainObject
  select?: PlainObject
  orderBy?: PlainObject
  take?: number
}

const DATABASE_URL = process.env.DATABASE_URL || ""

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL")
}

const globalForPg = globalThis as unknown as { pool?: Pool }

const pool =
  globalForPg.pool ??
  new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool
}

const TABLES: Record<string, string> = {
  tenant: "Tenant",
  account: "Account",
  user: "User",
  lead: "Lead",
  client: "Client",
  appointment: "Appointment",
  activity: "Activity",
  conversation: "Conversation",
  message: "Message",
  metaAccount: "MetaAccount",
  metaPage: "MetaPage",
}

const TIMESTAMP_FIELDS: Record<string, { createdAt?: boolean; updatedAt?: boolean }> = {
  tenant: { createdAt: true, updatedAt: true },
  user: { createdAt: true, updatedAt: true },
  lead: { createdAt: true, updatedAt: true },
  client: { createdAt: true, updatedAt: true },
  appointment: { createdAt: true, updatedAt: true },
  activity: { createdAt: true },
  conversation: { createdAt: true, updatedAt: true },
  message: { createdAt: true },
  metaAccount: { createdAt: true, updatedAt: true },
  metaPage: { createdAt: true, updatedAt: true },
}

function qid(name: string) {
  return `"${name.replace(/"/g, "\"\"")}"`
}

function tableName(model: string) {
  return qid(TABLES[model] || model)
}

function isPlainObject(v: unknown): v is PlainObject {
  return Object.prototype.toString.call(v) === "[object Object]"
}

function normalizeWhere(where?: PlainObject): PlainObject {
  if (!where) return {}
  const out: PlainObject = {}
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue
    if (
      isPlainObject(value) &&
      key.includes("_") &&
      !["OR", "AND", "NOT"].includes(key) &&
      !("contains" in value) &&
      !("in" in value) &&
      !("not" in value) &&
      !("gte" in value)
    ) {
      Object.assign(out, value)
      continue
    }
    out[key] = value
  }
  return out
}

function buildWhere(where: PlainObject | undefined, params: any[]): string {
  const normalized = normalizeWhere(where)
  const parts: string[] = []

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined) continue

    if (key === "OR" && Array.isArray(value)) {
      const orParts = value
        .map((item) => buildWhere(item, params))
        .filter(Boolean)
        .map((s) => `(${s.replace(/^WHERE\s+/i, "")})`)
      if (orParts.length) parts.push(orParts.join(" OR "))
      continue
    }

    if (key === "AND" && Array.isArray(value)) {
      const andParts = value
        .map((item) => buildWhere(item, params))
        .filter(Boolean)
        .map((s) => `(${s.replace(/^WHERE\s+/i, "")})`)
      if (andParts.length) parts.push(andParts.join(" AND "))
      continue
    }

    if (isPlainObject(value)) {
      if ("contains" in value) {
        params.push(`%${value.contains}%`)
        parts.push(`${qid(key)} ILIKE $${params.length}`)
        continue
      }
      if ("in" in value && Array.isArray(value.in)) {
        const placeholders = value.in.map((v: any) => {
          params.push(v)
          return `$${params.length}`
        })
        if (placeholders.length > 0) {
          parts.push(`${qid(key)} IN (${placeholders.join(", ")})`)
        } else {
          parts.push("1=0")
        }
        continue
      }
      if ("not" in value) {
        if (value.not === null) {
          parts.push(`${qid(key)} IS NOT NULL`)
        } else {
          params.push(value.not)
          parts.push(`${qid(key)} <> $${params.length}`)
        }
        continue
      }
      if ("gte" in value) {
        params.push(value.gte)
        parts.push(`${qid(key)} >= $${params.length}`)
        continue
      }
    }

    if (value === null) {
      parts.push(`${qid(key)} IS NULL`)
    } else {
      params.push(value)
      parts.push(`${qid(key)} = $${params.length}`)
    }
  }

  if (!parts.length) return ""
  return `WHERE ${parts.join(" AND ")}`
}

function buildOrderBy(orderBy?: PlainObject): string {
  if (!orderBy || !isPlainObject(orderBy)) return ""
  const entries = Object.entries(orderBy)
  if (!entries.length) return ""
  const [field, direction] = entries[0]
  const dir = String(direction).toUpperCase() === "DESC" ? "DESC" : "ASC"
  return `ORDER BY ${qid(field)} ${dir}`
}

function applySelect<T extends PlainObject>(row: T, select?: PlainObject): PlainObject {
  if (!select) return row
  const out: PlainObject = {}
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) out[key] = row[key]
  }
  return out
}

async function query(sql: string, params: any[] = []) {
  return pool.query(sql, params)
}

async function includeFor(model: string, row: PlainObject, include?: PlainObject): Promise<PlainObject> {
  if (!include) return row
  const out: PlainObject = { ...row }

  if (model === "activity" && include.user) {
    if (row.userId) {
      const user = await db.user.findFirst({ where: { id: row.userId }, select: include.user.select })
      out.user = user
    } else {
      out.user = null
    }
  }

  if (model === "appointment") {
    if (include.client) {
      out.client = row.clientId ? await db.client.findFirst({ where: { id: row.clientId } }) : null
    }
    if (include.lead) {
      out.lead = row.leadId ? await db.lead.findFirst({ where: { id: row.leadId } }) : null
    }
    if (include.user) {
      out.user = row.userId ? await db.user.findFirst({ where: { id: row.userId }, select: include.user.select }) : null
    }
  }

  if (model === "client") {
    if (include.appointments) {
      out.appointments = await db.appointment.findMany({ where: { clientId: row.id }, orderBy: { startTime: "asc" } })
    }
    if (include.activities) {
      out.activities = await db.activity.findMany({ where: { clientId: row.id }, orderBy: { createdAt: "desc" } })
    }
    if (include.conversations) {
      const rows = await db.conversation.findMany({ where: { clientId: row.id } })
      out.conversations = include.conversations.select
        ? rows.map((r: PlainObject) => applySelect(r, include.conversations.select))
        : rows
    }
  }

  if (model === "lead") {
    if (include.activities) {
      out.activities = await db.activity.findMany({ where: { leadId: row.id }, orderBy: { createdAt: "desc" } })
    }
    if (include.appointments) {
      out.appointments = await db.appointment.findMany({ where: { leadId: row.id }, orderBy: { startTime: "asc" } })
    }
    if (include.conversations) {
      const rows = await db.conversation.findMany({ where: { leadId: row.id } })
      out.conversations = include.conversations.select
        ? rows.map((r: PlainObject) => applySelect(r, include.conversations.select))
        : rows
    }
    if (include.convertedClient) {
      if (row.convertedClientId) {
        out.convertedClient = await db.client.findFirst({
          where: { id: row.convertedClientId },
          include: include.convertedClient.include,
        })
      } else {
        out.convertedClient = null
      }
    }
  }

  if (model === "conversation") {
    if (include.messages) {
      out.messages = await db.message.findMany({
        where: { conversationId: row.id },
        orderBy: include.messages.orderBy || { createdAt: "asc" },
        take: include.messages.take,
      })
    }
    if (include.lead) {
      out.lead = row.leadId ? await db.lead.findFirst({ where: { id: row.leadId }, select: include.lead.select }) : null
    }
    if (include.client) {
      out.client = row.clientId ? await db.client.findFirst({ where: { id: row.clientId }, select: include.client.select }) : null
    }
  }

  if (model === "user") {
    if (include.tenant) {
      out.tenant = row.tenantId ? await db.tenant.findFirst({ where: { id: row.tenantId } }) : null
    }
    if (include.accounts) {
      out.accounts = await db.account.findMany({ where: { userId: row.id } })
    }
  }

  if (model === "tenant") {
    if (include.users) out.users = await db.user.findMany({ where: { tenantId: row.id } })
    if (include.leads) out.leads = await db.lead.findMany({ where: { tenantId: row.id } })
    if (include.clients) out.clients = await db.client.findMany({ where: { tenantId: row.id } })
    if (include.appointments) out.appointments = await db.appointment.findMany({ where: { tenantId: row.id } })
    if (include.activities) out.activities = await db.activity.findMany({ where: { tenantId: row.id } })
    if (include.conversations) out.conversations = await db.conversation.findMany({ where: { tenantId: row.id } })
    if (include.metaAccounts) out.metaAccounts = await db.metaAccount.findMany({ where: { tenantId: row.id } })
    if (include.metaPages) out.metaPages = await db.metaPage.findMany({ where: { tenantId: row.id } })
  }

  if (model === "metaAccount" && include.pages) {
    out.pages = await db.metaPage.findMany({ where: { metaAccountId: row.id } })
  }

  return out
}

function createModel(model: string) {
  const tbl = tableName(model)

  return {
    async findMany(args: QueryArgs = {}) {
      const params: any[] = []
      const whereSql = buildWhere(args.where, params)
      const orderSql = buildOrderBy(args.orderBy)
      const takeSql = args.take ? `LIMIT ${Math.max(0, args.take)}` : ""
      const sql = [`SELECT * FROM ${tbl}`, whereSql, orderSql, takeSql].filter(Boolean).join(" ")
      const result = await query(sql, params)
      let rows = result.rows
      if (args.include) {
        rows = await Promise.all(rows.map((r) => includeFor(model, r, args.include)))
      } else if (args.select) {
        rows = rows.map((r) => applySelect(r, args.select))
      }
      return rows
    },

    async findFirst(args: QueryArgs = {}) {
      const rows = await this.findMany({ ...args, take: 1 })
      return rows[0] ?? null
    },

    async findUnique(args: QueryArgs = {}) {
      const rows = await this.findMany({ ...args, take: 1 })
      return rows[0] ?? null
    },

    async count(args: QueryArgs = {}) {
      const params: any[] = []
      const whereSql = buildWhere(args.where, params)
      const sql = `SELECT COUNT(*)::int AS count FROM ${tbl} ${whereSql}`.trim()
      const result = await query(sql, params)
      return result.rows[0]?.count ?? 0
    },

    async create({ data, include, select }: { data: PlainObject; include?: PlainObject; select?: PlainObject }) {
      const insertData: PlainObject = { ...data }
      const ts = TIMESTAMP_FIELDS[model] || {}

      // Legacy Prisma-created schemas often have no DB default for `id`,
      // so generate one when omitted.
      if (insertData.id === undefined) {
        insertData.id = randomUUID()
      }
      if (ts.createdAt && insertData.createdAt === undefined) {
        insertData.createdAt = new Date()
      }
      if (ts.updatedAt && insertData.updatedAt === undefined) {
        insertData.updatedAt = new Date()
      }

      const entries = Object.entries(insertData).filter(([, v]) => v !== undefined && !isPlainObject(v))
      const cols = entries.map(([k]) => qid(k))
      const params = entries.map(([, v]) => v)
      const placeholders = entries.map((_, i) => `$${i + 1}`)
      const sql = `INSERT INTO ${tbl} (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`
      const result = await query(sql, params)
      let row = result.rows[0]
      if (include) row = await includeFor(model, row, include)
      if (select) row = applySelect(row, select)
      return row
    },

    async update({ where, data, include, select }: { where: PlainObject; data: PlainObject; include?: PlainObject; select?: PlainObject }) {
      const existing = await this.findFirst({ where })
      if (!existing) {
        throw new Error(`${model} not found`)
      }
      const ts = TIMESTAMP_FIELDS[model] || {}
      const updateData: PlainObject = { ...data }
      if (ts.updatedAt && updateData.updatedAt === undefined) {
        updateData.updatedAt = new Date()
      }
      const setParts: string[] = []
      const params: any[] = []
      for (const [key, value] of Object.entries(updateData)) {
        if (value === undefined) continue
        if (isPlainObject(value) && "increment" in value) {
          params.push(value.increment)
          setParts.push(`${qid(key)} = COALESCE(${qid(key)}, 0) + $${params.length}`)
          continue
        }
        params.push(value)
        setParts.push(`${qid(key)} = $${params.length}`)
      }
      if (!setParts.length) return existing

      params.push(existing.id)
      const sql = `UPDATE ${tbl} SET ${setParts.join(", ")} WHERE "id" = $${params.length} RETURNING *`
      const result = await query(sql, params)
      let row = result.rows[0]
      if (include) row = await includeFor(model, row, include)
      if (select) row = applySelect(row, select)
      return row
    },

    async updateMany({ where, data }: { where?: PlainObject; data: PlainObject }) {
      const ts = TIMESTAMP_FIELDS[model] || {}
      const updateData: PlainObject = { ...data }
      if (ts.updatedAt && updateData.updatedAt === undefined) {
        updateData.updatedAt = new Date()
      }
      const setParts: string[] = []
      const params: any[] = []
      for (const [key, value] of Object.entries(updateData)) {
        if (value === undefined) continue
        if (isPlainObject(value) && "increment" in value) {
          params.push(value.increment)
          setParts.push(`${qid(key)} = COALESCE(${qid(key)}, 0) + $${params.length}`)
          continue
        }
        params.push(value)
        setParts.push(`${qid(key)} = $${params.length}`)
      }
      if (!setParts.length) return { count: 0 }
      const whereSql = buildWhere(where, params)
      const sql = `UPDATE ${tbl} SET ${setParts.join(", ")} ${whereSql}`.trim()
      const result = await query(sql, params)
      return { count: result.rowCount ?? 0 }
    },

    async delete({ where }: { where: PlainObject }) {
      const existing = await this.findFirst({ where })
      if (!existing) {
        throw new Error(`${model} not found`)
      }
      await query(`DELETE FROM ${tbl} WHERE "id" = $1`, [existing.id])
      return existing
    },

    async deleteMany({ where }: { where?: PlainObject }) {
      const params: any[] = []
      const whereSql = buildWhere(where, params)
      const sql = `DELETE FROM ${tbl} ${whereSql}`.trim()
      const result = await query(sql, params)
      return { count: result.rowCount ?? 0 }
    },

    async upsert({
      where,
      create,
      update,
      include,
      select,
    }: {
      where: PlainObject
      create: PlainObject
      update: PlainObject
      include?: PlainObject
      select?: PlainObject
    }) {
      const existing = await this.findFirst({ where })
      if (existing) {
        return this.update({ where, data: update, include, select })
      }
      return this.create({ data: create, include, select })
    },
  }
}

export const db = {
  tenant: createModel("tenant"),
  account: createModel("account"),
  user: createModel("user"),
  lead: createModel("lead"),
  client: createModel("client"),
  appointment: createModel("appointment"),
  activity: createModel("activity"),
  conversation: createModel("conversation"),
  message: createModel("message"),
  metaAccount: createModel("metaAccount"),
  metaPage: createModel("metaPage"),
}

export async function dbQuery(sql: string, params: any[] = []) {
  return query(sql, params)
}
