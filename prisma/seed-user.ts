import "dotenv/config"
import bcrypt from "bcryptjs"
import { Client } from "pg"

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query("BEGIN")

    const tenantId = `t_${Date.now()}`
    const userId = `u_${Date.now()}`
    const hashedPassword = await bcrypt.hash("password123", 10)

    await client.query(
      `INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [tenantId, "Acme Corp", `acme-${Date.now()}`]
    )

    await client.query(
      `INSERT INTO "User" ("id", "email", "name", "hashedPassword", "role", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [userId, "test@example.com", "Test User", hashedPassword, "ADMIN", tenantId]
    )

    await client.query("COMMIT")

    console.log({
      tenantId,
      user: "test@example.com",
      password: "password123",
    })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

