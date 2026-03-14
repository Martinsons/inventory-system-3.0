"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
    label: string;
    href: string;
    permission?: string;  // required permission to see this link
};

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/" },
    { label: "Inventory", href: "/inventory", permission: "inventory.view" },
    { label: "Orders", href: "/orders", permission: "orders.view" },
    { label: "Reports", href: "/reports", permission: "reports.view" },
    { label: "Users", href: "/admin/users", permission: "users.manage" },
    { label: "Roles", href: "/admin/roles", permission: "roles.manage" },
];

export default function Sidebar({ permissions }: { permissions: string[] }) {
    const pathname = usePathname();

    const visibleItems = navItems.filter(
        (item) => !item.permission || permissions.includes(item.permission)
    );

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
            <div className="text-xl font-bold mb-8 px-2">My App</div>
            <nav className="space-y-1">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}