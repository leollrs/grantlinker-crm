
const { Client } = require("pg")

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })

    try {
        await client.connect()
        const res = await client.query('SELECT COUNT(*)::int AS count FROM "User"')
        console.log("User count:", res.rows[0]?.count ?? 0)
        console.log("Postgres connection test SUCCESSFUL")
    } catch (e) {
        console.error("Postgres connection test FAILED")
        console.error(e)
    } finally {
        await client.end()
    }
}

main()
