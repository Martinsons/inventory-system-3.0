// middleware.ts runs on the Edge (server-side) before EVERY request reaches a page or API route.
// Its job here: protect pages from unauthenticated access by checking the Supabase session.
//
// Mental model:
//   Browser sends request
//     → middleware intercepts it
//       → asks Supabase "is there a valid session in these cookies?"
//         → yes: let the request through (or redirect away from login if already logged in)
//         → no:  redirect to /login
//
// Why this file exists at all (vs. checking auth inside each page):
//   Doing auth checks inside each page component means unprotected pages can accidentally
//   slip through, and it causes flashes of unauthenticated content. Middleware runs first,
//   before any page code executes, so protection is guaranteed and centralized.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    // Start with a "pass-through" response — let the request continue unchanged.
    // We may reassign this variable later if Supabase needs to refresh tokens (see setAll below).
    let supabaseResponse = NextResponse.next({request});

    // Create a Supabase client scoped to this single server-side request.
    // We can't use a browser client here because there's no browser context — we're on the server edge.
    // @supabase/ssr provides createServerClient specifically for this environment.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            // Supabase uses cookies to persist the session (access token + refresh token).
            // We must teach this server-side client how to read and write cookies manually,
            // because there's no automatic browser cookie jar on the server.
            cookies: {
                // getAll: Supabase calls this to read the current session from the incoming request.
                // request.cookies holds all cookies the browser sent with this request.
                getAll() {
                    return request.cookies.getAll();
                },

                // setAll: Supabase calls this when it needs to write cookies — typically when it
                // silently refreshes an expiring access token using the refresh token.
                //
                // The tricky part: we need to set cookies in TWO places:
                //   1. request.cookies  — so the Supabase client itself sees the updated token
                //                         for the rest of this request's lifetime.
                //   2. supabaseResponse — so the Set-Cookie header goes back to the browser,
                //                         meaning the browser stores the refreshed token for future requests.
                //
                // If we only set the response cookie, the in-flight request still has the old token.
                // If we only set the request cookie, the browser never learns about the refresh and
                // will send the old (expiring) token on the very next request.
                setAll(cookiesToSet) {
                    // Step 1: update the request object so this Supabase client sees the new values.
                    cookiesToSet.forEach(({name, value}) =>
                        request.cookies.set(name, value)
                    );

                    // Step 2: recreate the response now that the request object has the fresh cookies.
                    // We reassign supabaseResponse (the outer variable) so we always return
                    // the most up-to-date response from this middleware.
                    supabaseResponse = NextResponse.next({request});

                    // Step 3: attach the Set-Cookie headers to the response so the browser is updated.
                    // options contains things like maxAge, httpOnly, sameSite, etc.
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Ask Supabase to verify the session in the cookies.
    // getUser() makes a network call to validate the token — it's more secure than getSession(),
    // which only decodes the JWT locally without checking if it has been revoked server-side.
    const { data: {user} } = await supabase.auth.getUser();

    // Guard 1 — Not logged in and trying to access a protected page → send to login.
    // We carve out /login and /auth so users can actually reach the login page and
    // so Supabase's OAuth callback (/auth/callback) isn't blocked.
    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth")
    ) {
        // Clone the current URL so we only change the pathname, preserving host/protocol.
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Guard 2 — Already logged in but landed on /login → redirect to home.
    // This prevents a logged-in user from seeing the login page (e.g. if they bookmark it).
    if (
        user && request.nextUrl.pathname.startsWith("/login")
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    // No redirect needed — return the response (which may carry refreshed session cookies).
    // IMPORTANT: always return supabaseResponse, not a fresh NextResponse.next().
    // A fresh response would drop the Set-Cookie headers Supabase may have added above.
    return supabaseResponse;
}

// config.matcher tells Next.js which paths this middleware should run on.
// The regex here means: run on everything EXCEPT:
//   - _next/static  — compiled JS/CSS bundles (no auth needed, and checking adds latency)
//   - _next/image   — Next.js image optimization endpoint
//   - favicon.ico   — browser icon request
//   - image files   — .svg, .png, .jpg, .jpeg, .gif, .webp
//
// The double negative (?!...) is a regex negative lookahead:
//   "match any path that does NOT start with these patterns"
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
