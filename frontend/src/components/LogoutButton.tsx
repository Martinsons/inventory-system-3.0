// "use client" is required because this component uses useRouter and an onClick handler —
// both are browser-only APIs that don't exist during server-side rendering.
"use client";

// Browser Supabase client — correct here because signOut() needs to clear the session
// cookie in the browser (via document.cookie), which only works client-side.
import { createClient } from "@/lib/supabase/client";

// useRouter for programmatic navigation after logout.
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    // Create the Supabase browser client. It automatically reads the current
    // session from the browser's cookies without any extra configuration.
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        // signOut() tells Supabase to invalidate the session on its servers
        // AND clears the session cookies from the browser.
        // After this, any call to getUser() will return null.
        await supabase.auth.signOut();

        // Redirect to login. We use router.push (not router.refresh) because
        // we want a full navigation to /login, not just a server data re-fetch.
        // The middleware will enforce the redirect anyway, but this makes the
        // UX immediate rather than waiting for the next navigation.
        router.push("/login");
    };

    return (
        // onClick fires handleLogout — no form or e.preventDefault() needed
        // because this is just a button, not a form submit.
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
        >
            Sign Out
        </button>
    );
}