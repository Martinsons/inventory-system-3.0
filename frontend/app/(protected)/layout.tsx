// requireUser() is our auth guard — it checks the session and redirects to /login if there isn't one.
import { requireUser } from "@/lib/supabase/auth";

// This is a Server Component layout that wraps every route inside the (protected) folder.
//
// HOW THE FOLDER NAME WORKS:
// The parentheses in "(protected)" make this a Route Group — a Next.js convention that
// groups routes together for shared layouts without affecting the URL.
// So /dashboard, /inventory etc. all get this layout applied, but their URLs don't
// contain the word "protected". It's invisible to the browser.
//
// WHY A LAYOUT AND NOT MIDDLEWARE:
// Middleware (middleware.ts) already blocks unauthenticated users at the network edge.
// This layout is a second layer of defence at the React tree level — it ensures that
// even if middleware is misconfigured, no protected Server Component ever renders
// for a user without a valid session.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // await requireUser() either:
  //   a) verifies the session is valid and returns — execution continues normally, or
  //   b) calls redirect("/login") which throws internally and stops execution here.
  // Either way, if we reach the return statement, the user is guaranteed to be authenticated.
  await requireUser();

  // <> </> is a React Fragment — a wrapper that renders no DOM element.
  // We need something to return but don't want an extra <div> in the HTML.
  // children is whatever page matched the current URL inside (protected).
  return <>{children}</>;
}
