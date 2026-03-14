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
};

export const usePermissions = () => {
    const [state, setState] = useState<PermissionState>({
        role: "",
        permissions: [],
        loading: true,
    });

    useEffect(() => {
        async function fetchPermissions() {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setState({ role: "", permissions: [], loading: false });
                return;
            }

            const { data: profile } = await supabase
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
                .single() as { data: ProfileRow | null; error: unknown };

            const role = profile?.roles?.name || "user";
            const permissions = profile?.roles?.role_permissions?.map(
                (rp) => rp.permissions.name
            ) || [];

            setState({ role, permissions, loading: false });
        }

        fetchPermissions();
    }, []);

    return state;
};

export function hasPermission(permissions: string[], requiredPermission: string): boolean {
    return permissions.includes(requiredPermission);
}
