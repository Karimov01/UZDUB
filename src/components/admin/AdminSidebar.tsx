"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Play, LayoutDashboard, Film, Tv, Users, Settings,
  BarChart3, Tag, LogOut, ChevronRight, Home, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Kinolar", href: "/admin/kinolar", icon: Film },
  { label: "Seriallar", href: "/admin/seriallar", icon: Tv },
  { label: "Foydalanuvchilar", href: "/admin/foydalanuvchilar", icon: Users },
  { label: "Janrlar", href: "/admin/janrlar", icon: Tag },
  { label: "Izohlar", href: "/admin/izohlar", icon: MessageCircle },
  { label: "Statistika", href: "/admin/statistika", icon: BarChart3 },
  { label: "Sozlamalar", href: "/admin/sozlamalar", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 flex flex-col z-40"
      style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
        <div>
          <span className="text-base font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>UZDUB</span>
          <span className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}> Play</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "text-white"
                  : "hover:bg-white/5"
              )}
              style={isActive ? { background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))", border: "1px solid rgba(124,58,237,0.3)", color: "var(--accent-violet)" } : { color: "var(--text-muted)" }}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "" : "group-hover:text-white transition-colors")} style={{ width: 18, height: 18 }} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 w-full"
          style={{ color: "var(--text-muted)" }}
        >
          <Home className="shrink-0" style={{ width: 18, height: 18 }} />
          Saytga qaytish
        </Link>
        <button
          onClick={() => signOut({ redirectTo: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10 w-full text-left"
          style={{ color: "#EF4444" }}
        >
          <LogOut className="shrink-0" style={{ width: 18, height: 18 }} />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
