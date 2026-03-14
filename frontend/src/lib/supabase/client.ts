// client.ts — a factory function that creates a Supabase client for use inside
// Client Components (any file with "use client" at the top).
//
// Mental model:
//   The browser IS the environment here. The user's browser is running this JavaScript,
//   and it has direct access to document.cookie and localStorage. So this is much simpler
//   than the server-side version — we don't need to manually wire up cookie handlers.
//   createBrowserClient handles all of that automatically.
//
// Why this is a function and not just a single exported client instance:
//   You might expect to see: export const supabase = createBrowserClient(...)
//   Instead it's a function you call. This is a safety pattern — it ensures that in
//   server-side rendering (SSR), each render gets a fresh client rather than accidentally
//   sharing state across requests. In the browser, calling it multiple times is fine
//   because @supabase/ssr deduplciates the client internally (returns the same instance).
//
// How this fits with the other two files:
//   middleware.ts      — edge, before page loads, uses raw request/response cookies
//   lib/supabase/server.ts — server-side rendering, uses Next.js cookies() helper
//   lib/supabase/client.ts — browser, uses document.cookie automatically (this file)
//
// Rule of thumb for which to import:
//   "use client" component or browser event handler → import from this file
//   Server Component, Server Action, Route Handler  → import from server.ts

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    // createBrowserClient automatically reads and writes cookies via document.cookie.
    // No manual cookie wiring needed — that complexity only exists on the server
    // because the server has no browser context.
    //
    // The two env vars are public (prefixed NEXT_PUBLIC_) intentionally:
    //   NEXT_PUBLIC_SUPABASE_URL      — the URL of your Supabase project (not secret)
    //   NEXT_PUBLIC_SUPABASE_ANON_KEY — a limited "anonymous" key that enforces Row Level
    //                                   Security (RLS) policies on the database. It is safe
    //                                   to expose in the browser because Supabase's security
    //                                   model assumes this key is public — RLS is the real guard.
    //
    // The ! (non-null assertion) tells TypeScript "trust me, these env vars exist."
    // If they're missing at runtime, Supabase will throw with a descriptive error.
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
