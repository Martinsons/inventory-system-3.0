// app/auth/callback/route.ts — the OAuth/magic-link landing page.
//
// Mental model — the OAuth flow has two legs:
//
//   Leg 1 (leaving your app):
//     User clicks "Sign in with Google" → your app redirects them to Supabase,
//     which redirects them to Google. The user logs in on Google's website.
//
//   Leg 2 (returning to your app):  ← THIS FILE HANDLES THIS
//     Google redirects back to Supabase, Supabase bundles the result into a
//     short-lived one-time "code" and redirects the browser to:
//       https://yourapp.com/auth/callback?code=abc123
//     This route handler receives that request, swaps the code for a real session,
//     then sends the user to the app.
//
// Why a one-time code instead of sending the session token directly in the URL?
//   Sending a long-lived token in a URL is dangerous — it can end up in browser history,
//   server logs, and referrer headers. The short-lived code is useless after one use,
//   so even if it leaks, the damage window is tiny.
//
// This is a Next.js Route Handler (not a page). It only responds to HTTP requests —
// it renders no UI. The file lives at app/auth/callback/route.ts which maps to the
// URL path /auth/callback, which is what you register as the redirect URL in Supabase
// and your OAuth provider (e.g. Google, GitHub).

// ⚠️  LIKELY BUG: this imports the BROWSER client (lib/supabase/client.ts).
// Route Handlers run on the server — there is no document.cookie here.
// This should almost certainly import from "@/lib/supabase/server" instead,
// so the session cookies get written into the server-side response correctly.
// With the browser client, exchangeCodeForSession() may fail silently or not
// persist the session cookie, causing the user to appear logged-out after redirect.
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Next.js calls this function when a GET request hits /auth/callback.
export async function GET(request: Request) {
    // Pull the query parameters and the base origin out of the incoming URL.
    //   code   — the one-time authorization code Supabase appended to the redirect URL
    //   next   — an optional "where to send the user after login" path, e.g. "?next=/dashboard"
    //            defaults to "/" if not provided
    //   origin — the base URL, e.g. "https://yourapp.com" — used to build absolute redirect URLs
    const {searchParams, origin} = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/";

    if(code) {
        // Create a Supabase client to perform the exchange.
        const supabase = await createClient();

        // exchangeCodeForSession() sends the code to Supabase's servers.
        // Supabase verifies it, creates a session (access token + refresh token),
        // and writes those tokens into cookies so the user is now "logged in."
        // After this call, every subsequent server request will see the session
        // in its cookies — which is what middleware.ts reads to allow access.
        const {error} = await supabase.auth.exchangeCodeForSession(code);

        if(!error) {
            // Exchange succeeded → redirect the user into the app.
            // `next` lets other parts of the app say "after login, go here."
            // e.g. if the user tried to visit /orders while logged out, middleware
            // could redirect them to /login?next=/orders, and after login they
            // land back on /orders instead of the home page.
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Two failure cases both land here:
    //   1. No code in the URL — something went wrong before we were even called
    //      (e.g. the user denied the OAuth consent screen, or tampered with the URL)
    //   2. exchangeCodeForSession returned an error — code was invalid, expired, or already used
    //
    // In both cases, send the user back to login so they can try again.
    // A production app might want to add ?error=... to the URL so the login page
    // can show a "something went wrong, please try again" message.
    return NextResponse.redirect(`${origin}/login`);
}
