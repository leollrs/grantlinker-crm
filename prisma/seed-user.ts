import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash("password123", 10)

    const tenant = await prisma.tenant.create({
        data: {
            name: "Acme Corp",
            slug: "acme",
            users: {
                create: {
                    email: "test@example.com",
                    name: "Test User",
                    hashedPassword,
                    role: "ADMIN",
                },
            },
        },
    })

    console.log({
        tenant,
        user: "test@example.com",
        password: "password123"
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
