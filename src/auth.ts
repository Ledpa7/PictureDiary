import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google,
        Credentials({
            name: "Mock Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
            },
            async authorize(credentials) {
                // Testing only
                return {
                    id: "test-user-1",
                    name: "Test User",
                    email: "test@example.com",
                    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    // Prevent server crash if env var is missing during dev
    secret: process.env.AUTH_SECRET || "dummy_secret_for_dev_mode_only",
})
