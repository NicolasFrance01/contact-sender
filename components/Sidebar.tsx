"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    History,
    Settings,
    Users,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Send,
} from "lucide-react";

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["READER", "EDITOR", "MANAGER", "ADMIN"] },
    { href: "/templates", icon: FileText, label: "Plantillas", roles: ["READER", "EDITOR", "MANAGER", "ADMIN"] },
    { href: "/contracts", icon: FileText, label: "Generados", roles: ["READER", "EDITOR", "MANAGER", "ADMIN"] },
    { href: "/history", icon: History, label: "Historial", roles: ["READER", "EDITOR", "MANAGER", "ADMIN"] },
    { href: "/settings", icon: Settings, label: "Configuración", roles: ["MANAGER", "ADMIN"] },
    { href: "/settings/users", icon: Users, label: "Usuarios", roles: ["ADMIN"] },
];

interface SidebarProps {
    userRole: string;
    userName: string;
    userEmail: string;
}

export default function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const allowedNav = navItems.filter((item) => item.roles.includes(userRole));

    return (
        <aside
            className="flex flex-col h-screen sticky top-0 transition-all duration-300"
            style={{
                width: collapsed ? "72px" : "240px",
                minWidth: collapsed ? "72px" : "240px",
                background: "var(--color-surface-1)",
                borderRight: "1px solid var(--color-border)",
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 relative" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--color-gold-dark), var(--color-gold))" }}>
                    <Send className="w-4 h-4 text-black" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <div className="text-sm font-semibold leading-tight whitespace-nowrap" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}>
                            Contract Sender
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Sistema de contratos
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {allowedNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                isActive ? "active-nav" : "hover-nav"
                            )}
                            style={{
                                background: isActive ? "var(--color-gold-muted)" : "transparent",
                                color: isActive ? "var(--color-gold)" : "var(--color-text-muted)",
                                border: isActive ? "1px solid rgba(198,167,94,0.2)" : "1px solid transparent",
                            }}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User info & logout */}
            <div className="p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                {!collapsed && (
                    <div className="px-3 py-2 mb-2 rounded-xl" style={{ background: "var(--color-surface-3)" }}>
                        <div className="text-sm font-medium truncate">{userName}</div>
                        <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{userEmail}</div>
                        <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                            style={{ background: "var(--color-gold-muted)", color: "var(--color-gold)", border: "1px solid rgba(198,167,94,0.2)" }}>
                            {userRole}
                        </div>
                    </div>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}
