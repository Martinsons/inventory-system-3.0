import { requireAuth } from "@/lib/supabase/auth";
import Sidebar from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // requireAuth() redirects to /login if there's no session.
    // Returns user + role + permissions + fullName — all from one cached DB call.
    const { user, role, permissions, fullName } = await requireAuth();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar permissions={permissions} />
            <div className="flex-1">
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div />
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{role}</span>
                        <span className="text-sm text-gray-600">
                            {fullName || user.email}
                        </span>
                        <LogoutButton />
                    </div>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
