// server.ts — a factory function that creates a Supabase client for use inside
// Server Components, Server Actions, and Route Handlers (anything that runs on the server
// in Next.js App Router, but NOT middleware).
//
// Mental model:
//   This file answers the question: "How do I talk to Supabase from server-side Next.js code?"
//   The answer is: create a client that reads/writes cookies through Next.js's own cookie store,
//   rather than the browser's document.cookie (which doesn't exist on the server).
//
// How this differs from middleware.ts:
//   middleware.ts also uses createServerClient, but it works with the raw NextRequest/NextResponse
//   objects because middleware runs at the edge before a page is rendered.
//   THIS file uses Next.js's `cookies()` helper, which is only available during page rendering
//   inside the App Router (Server Components, Actions, Route Handlers).
//   Think of middleware as the "gate" and this client as the "worker inside the building."

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// createClient is async because Next.js's cookies() function is async in newer versions.
// We export a factory function (not a pre-built client) so each request gets its own
// fresh client with its own snapshot of the current request's cookies.
// Sharing one client across requests would mix up sessions between users.
export async function createClient() {
    // cookies() returns the cookie store for the currently executing request.
    // This is a Next.js App Router API — it reads from the incoming HTTP request headers,
    // similar to how request.cookies works in middleware, but accessible anywhere on the server.
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            // Same pattern as middleware: we must teach the server-side Supabase client
            // how to read and write cookies because there's no browser environment here.
            cookies: {
                // getAll: called by Supabase when it needs to read the current session.
                // cookieStore.getAll() returns all cookies from the current request.
                getAll() {
                    return cookieStore.getAll();
                },

                // setAll: called by Supabase when it needs to write cookies — e.g. when
                // silently refreshing an expiring access token.
                //
                // Notice this is simpler than middleware.ts: we only write to cookieStore once.
                // We don't need to update both a request object AND a response object because
                // Next.js's cookieStore handles that internally — it knows how to attach
                // Set-Cookie headers to the outgoing response automatically.
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({name, value, options}) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The try/catch exists because cookieStore.set() will throw if called
                        // from inside a Server Component (as opposed to a Server Action or Route Handler).
                        //
                        // Why? Server Components are purely for rendering — they cannot set response
                        // headers (like Set-Cookie) because by the time they run, the response
                        // headers may already be committed or streaming.
                        //
                        // The error is intentionally swallowed (empty catch) because:
                        //   - If we're in a Server Component, the session refresh not being persisted
                        //     is acceptable — the middleware (which runs before all of this) is the
                        //     one responsible for keeping the session alive and propagating fresh tokens.
                        //   - We don't want to crash the render just because a cookie couldn't be set.
                        //
                        // In short: middleware handles token refresh persistence,
                        // this client just reads the (already-refreshed) session.
                    }
                },
            },
        }
    );
};