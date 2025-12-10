import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith('/journal') || req.nextUrl.pathname.startsWith('/gallery')

    if (isOnDashboard) {
        if (isLoggedIn) return
        // Temporarily disabled for Mock Mode
        // return Response.redirect(new URL('/login', req.nextUrl))
    }
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
