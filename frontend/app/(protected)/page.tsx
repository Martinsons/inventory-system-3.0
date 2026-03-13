// requireUser() is our auth guard — verifies the session server-side and redirects
// to /login if there is none. It also returns the user and their profile row.
import { requireUser } from "@/lib/supabase/auth";

// LogoutButton is a Client Component (it has "use client" and uses onClick).
// We can freely import Client Components into Server Components — Next.js handles
// the boundary automatically. The server renders the shell; the button hydrates in the browser.
import LogoutButton from "@/components/LogoutButton";

// This is a Server Component (no "use client" directive).
// It runs entirely on the server: it can await async functions, query the database,
// and access cookies — none of which are possible in a Client Component.
export default async function Home() {
    // requireUser() does two things in one call:
    //   1. Verifies the session — redirects to /login if invalid (never reaches the return below)
    //   2. Fetches the profile row from the database — so we have the user's name ready to render
    // Both user and profile are available synchronously in the JSX below — no loading states needed.
    const { user, profile } = await requireUser();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar: max-w-7xl centers content with a max width, mx-auto handles horizontal centering.
                flex justify-between pushes the title to the left and the user info to the right. */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold">My App</h1>
                    <div className="flex items-center gap-4">
                        {/* Show the profile's full name if it exists, otherwise fall back to
                            the email address from the auth user object.
                            profile?.full_name uses optional chaining because profile can be null
                            if the profiles table has no row for this user yet. */}
                        <span className="text-sm text-gray-600">
                            {profile?.full_name || user.email}
                        </span>

                        {/* LogoutButton is a Client Component embedded inside this Server Component.
                            Next.js serialises the server-rendered HTML and sends it to the browser,
                            then hydrates just the button so its onClick handler becomes active. */}
                        <LogoutButton />
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Ternary: if we have a full name, show ", John". If not, show nothing.
                    The "!" at the end is outside the expression so it always appears. */}
                <h2 className="text-2xl font-bold mb-4">
                    Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}!
                </h2>
                {/* user.email comes from the Supabase auth object — always present for
                    email/password users. No optional chaining needed here. */}
                <p className="text-gray-600">
                    You are logged in as {user.email}
                </p>
            </main>
        </div>
    );
}
