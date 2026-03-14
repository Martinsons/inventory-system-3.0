"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type ProfileRow = {
    roles: {
        name: string;
        role_permissions: {
            permissions: {
                name: string;
            };
        }[];
    } | null;
};

type PermissionState = {
    role: string;
    permissions: string[];
    loading: boolean;
    error: string | null;
};

export const usePermissions = () => {
    const [state, setState] = useState<PermissionState>({
        role: "",
        permissions: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const controller = new AbortController();

        async function fetchPermissions() {
            const supabase = createClient();

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (controller.signal.aborted) return;

            // authError: Supabase returned an error — surface it.
            // !user: no active session — not an error, just unauthenticated.
            if (authError || !user) {
                setState({ role: "", permissions: [], loading: false, error: authError?.message ?? null });
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select(`
                    roles (
                        name,
                        role_permissions (
                            permissions (name)
                        )
                    )
                `)
                .eq("id", user.id)
                .single() as { data: ProfileRow | null; error: { message: string } | null };

            if (controller.signal.aborted) return;

            if (profileError) {
                setState({ role: "", permissions: [], loading: false, error: profileError.message });
                return;
            }

            const role = profile?.roles?.name || "user";
            const permissions = profile?.roles?.role_permissions?.map(
                (rp) => rp.permissions.name
            ) || [];

            setState({ role, permissions, loading: false, error: null });
        }

        fetchPermissions();

        return () => controller.abort();
    }, []);

    return state;
};

export function hasPermission(permissions: string[], requiredPermission: string): boolean {
    return permissions.includes(requiredPermission);
}
