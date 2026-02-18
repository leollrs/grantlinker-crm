
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const userCount = await prisma.user.count()
        console.log('User count:', userCount)
        console.log('Prisma test SUCCESSFUL')
    } catch (e) {
        console.error('Prisma test FAILED')
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
