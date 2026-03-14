import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";

// Typed shape of the joined profile query
type ProfileRow = {
    full_name: string | null;
    roles: {
        name: string;
        role_permissions: {
            permissions: {
                name: string;
            };
        }[];
    } | null;
};

export type UserData = {
    user: import("@supabase/supabase-js").User;
    role: string;
    permissions: string[];
    fullName: string | null;
};

// cache() is a React server-side primitive that deduplicates calls within a single request.
// No matter how many server components or layouts call getUser(), Supabase is only queried once.
export const getUser = cache(async (): Promise<UserData | null> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
            full_name,
            roles (
                name,
                role_permissions (
                    permissions (name)
                )
            )
        `)
        .eq("id", user.id)
        .single() as { data: ProfileRow | null; error: { message: string } | null };

    if (profileError) {
        throw new Error(`Failed to load user profile: ${profileError.message}`);
    }

    const role = profile?.roles?.name || "user";
    const permissions: string[] = profile?.roles?.role_permissions?.map(
        (rp) => rp.permissions.name
    ) || [];

    return { user, role, permissions, fullName: profile?.full_name ?? null };
});

// Redirects to /login if there is no valid session.
// Returns UserData so callers don't need a separate getUser() call.
export async function requireAuth(): Promise<UserData> {
    const data = await getUser();
    if (!data) redirect("/login");
    return data;
}

// Redirects to /unauthorized if the user doesn't have the required permission.
// Use at the top of any server component or page that needs a specific capability.
export async function requirePermission(permission: string): Promise<UserData> {
    const data = await requireAuth();
    if (!data.permissions.includes(permission)) redirect("/unauthorized");
    return data;
}
