import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            tenantId: string
        } & DefaultSession["user"]
    }

    interface User {
        tenantId: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        tenantId: string
    }
}
