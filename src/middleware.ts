import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEBUG_COOKIE_NAME, isDebugPhone } from "./lib/constants";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Debug user bypass
    const debugCookie = request.cookies.get(DEBUG_COOKIE_NAME);
    const debugUserPhone = debugCookie?.value;
    const isDebugActive = debugUserPhone && isDebugPhone(debugUserPhone);
    const effectiveUser = user || (isDebugActive ? { phone: debugUserPhone } : null);

    const pathname = request.nextUrl.pathname;

    // Protected routes
    const adminRoutes = ["/admin"];
    const customerRoutes = ["/my-appointments"];
    const authRoutes = ["/login"];

    // Redirect logged-in users away from auth routes
    if (effectiveUser && authRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/book", request.url));
    }

    // Redirect unauthenticated users to login
    if (!effectiveUser && customerRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Admin route protection - check if user's phone is in admin table
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
        if (!effectiveUser) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        // Role check happens client-side after login for simplicity
        // Server-side admin check would require DB call in middleware
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
