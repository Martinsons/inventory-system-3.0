// "use client" tells Next.js to render this component in the browser, not on the server.
// This is required because we use useState, useRouter, and event handlers — all browser-only APIs.
"use client";

// Browser Supabase client — reads/writes cookies via document.cookie, which only exists in the browser.
// This is correct here because this is a Client Component.
import { createClient } from "@/lib/supabase/client";

// useRouter lets us navigate programmatically (e.g. push to "/" after login).
import { useRouter } from "next/navigation";

// useState manages local form state without involving any server or database.
import { useState } from "react";

export default function LoginPage() {
  // Controlled inputs: React owns the values, not the DOM.
  // Every keystroke calls the setter, keeping state in sync with what's on screen.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // One boolean flag lets this single page serve as BOTH sign-in and sign-up.
  // No need for two separate routes — just flip this to re-label the whole form.
  const [isSignUp, setIsSignUp] = useState(false);

  // Doubles as both an error message (shown in red) and a success message (shown in green).
  // We inspect the message content at render time to decide which color to use.
  const [error, setError] = useState<string | null>(null);

  // useRouter gives us push() for navigation and refresh() to re-run server data fetching.
  const router = useRouter();

  // Create the Supabase browser client once per render.
  // It reads the current session from cookies automatically.
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser's default form behavior (full page reload / GET request).
    // Without this, the form would navigate away before our async logic could run.
    e.preventDefault();

    // Clear any previous error so stale messages don't confuse the user on retry.
    setError(null);

    if (isSignUp) {
      // signUp() creates a new user and sends a confirmation email.
      // emailRedirectTo tells Supabase where to send the user after they click the link.
      // That destination (/auth/callback) exchanges the one-time code for a real session.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        // We can't redirect immediately — the user must confirm their email first.
        // Reusing the error state for this success message keeps the UI simple.
        setError("Check your email for the login link!");
      }
    } else {
      // signInWithPassword() authenticates directly and sets the session cookie in the browser.
      // No email confirmation step — the user is logged in immediately on success.
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        // router.push navigates the browser to the home page.
        // router.refresh re-runs server-side fetching so the middleware and server
        // components see the newly set session cookies right away. Both lines are needed.
        router.push("/");
        router.refresh();
      }
    }
  };

  return (
    // Center the card both horizontally and vertically on the full screen.
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      {/* max-w-md caps the card width so it doesn't stretch on wide screens. */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">

        {/* Title re-labels itself based on the current mode — no separate pages needed. */}
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>

        {/* space-y-4 adds consistent vertical gap between every direct child element. */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* htmlFor must match the input's id so clicking the label focuses the input (accessibility). */}
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"         // browser validates email format before handleSubmit even runs
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required             // browser blocks submit if empty
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"      // masks the characters on screen
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}        // Supabase minimum — enforced here before hitting the network
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters"
            />
          </div>

          {/* Only renders when there is a message to show.
              Checks the message text to decide color: green for success, red for errors.
              This works because we control exactly what string goes into this state. */}
          {error && (
            <p
              className={`text-sm ${error.includes("Check your email") ? "text-green-600" : "text-red-600"}`}
            >
              {error}
            </p>
          )}

          {/* Submit button label mirrors the current mode. */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          {/* Toggles between Sign In and Sign Up mode without any routing.
              Also clears the error so stale messages don't bleed into the other mode. */}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
