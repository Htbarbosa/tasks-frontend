import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = ["/login", "/api/auth"];

export async function middleware(req: NextRequest) {
    const { nextUrl } = req;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isLoggedIn = !!token;

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(
        (route) =>
            nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
    );

    // Allow public routes
    if (isPublicRoute) {
        // If logged in and trying to access login page, redirect to home
        if (isLoggedIn && nextUrl.pathname === "/login") {
            return NextResponse.redirect(new URL("/", nextUrl));
        }
        return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
    ],
};
