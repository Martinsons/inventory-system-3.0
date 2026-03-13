// redirect() is a Next.js server-side utility — calling it throws a special error
// that Next.js catches internally and turns into a 302 response. It only works in
// Server Components and Route Handlers, never in Client Components.
import { redirect } from "next/navigation";

// We need the SERVER client here because this function runs on the server
// (it will be called from Server Components or Route Handlers, never from the browser).
import { createClient } from "./server";

// requireUser is a reusable auth guard you call at the top of any Server Component
// or Route Handler that should only be accessible to logged-in users.
//
// The pattern: instead of copy-pasting the same auth check everywhere, you centralise
// it here. Any page that needs a user just calls `const { user, profile } = await requireUser()`.
export async function requireUser() {
    // createClient() is async on the server because it needs to await Next.js's cookies() API.
    const supabase = await createClient();

    // getUser() verifies the session token with Supabase's servers on every call.
    // This is intentionally more secure than getSession(), which only reads the local cookie
    // without validating it — an attacker with a tampered cookie could fool getSession().
    const { data: { user } } = await supabase.auth.getUser();

    // If there is no valid session, redirect immediately to the login page.
    // redirect() never returns — it throws internally, so nothing below this line runs.
    // This is the server-side equivalent of middleware protection, but at the function level.
    if(!user) redirect("/login");

    // Fetch the user's profile row from the "profiles" table using their auth user ID.
    // .single() tells Supabase to return one object instead of an array — assumes the
    // profiles table has exactly one row per user (enforced by a foreign key on id).
    // We use user! (non-null assertion) because we know user exists after the redirect guard above.
    const {data: profile} = await supabase.from("profiles").select("*").eq("id", user!.id).single();

    // Return both objects together so the caller gets everything it needs in one await.
    // The caller can destructure: const { user, profile } = await requireUser()
    return { user, profile };
}