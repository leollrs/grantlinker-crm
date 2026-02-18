
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
    // Removed PrismaAdapter - using JWT strategy doesn't need it
    // adapter: PrismaAdapter(db) as any,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login"
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar",
                    access_type: "offline",
                    prompt: "consent",
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await db.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                    include: {
                        tenant: true,
                    }
                })

                if (!user || !user.hashedPassword) {
                    // For safety, don't reveal if user exists or not if using generic errors
                    return null
                }

                const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)

                if (!isValid) {
                    return null
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    tenantId: user.tenantId, // Custom field
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                // Add tenantId to session
                (session.user as any).tenantId = token.tenantId
                session.user.id = token.id as string
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.tenantId = (user as any).tenantId
                token.id = user.id
            }
            return token
        },
    },
}
