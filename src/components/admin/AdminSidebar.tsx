"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3, ChevronLeft, ChevronRight, Film, Home, LayoutDashboard,
  LogOut, MessageCircle, MoreVertical, Play, Settings, Tag, Tv, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Kinolar", href: "/admin/kinolar", icon: Film },
  { label: "Seriallar", href: "/admin/seriallar", icon: Tv },
  { label: "Foydalanuvchilar", href: "/admin/foydalanuvchilar", icon: Users },
  { label: "Janrlar", href: "/admin/janrlar", icon: Tag },
  { label: "Izohlar", href: "/admin/izohlar", icon: MessageCircle },
  { label: "Hisobot", href: "/admin/hisobot", icon: BarChart3 },
  { label: "Sozlamalar", href: "/admin/sozlamalar", icon: Settings },
];

export default function AdminSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[.08] bg-[#090d18] shadow-[24px_0_70px_rgba(5,8,18,.35)] transition-transform duration-300 lg:w-[248px] lg:translate-x-0",
      mobileOpen ? "translate-x-0" : "-translate-x-full",
    )}>
      <div className="flex h-[88px] items-center gap-3 border-b border-white/[.07] px-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 shadow-[0_0_30px_rgba(168,85,247,.25)]">
          <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold"><span className="gradient-text">UZDUB</span> Play</p>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
        <button type="button" aria-label="Menyuni yopish" onClick={onClose} className="ml-auto hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white max-lg:flex"><X className="h-5 w-5" /></button>
      </div>

      <nav className="admin-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose} className={cn(
              "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all",
              active ? "bg-gradient-to-r from-violet-600/90 to-fuchsia-600/75 text-white shadow-[0_0_28px_rgba(124,58,237,.2)]" : "text-slate-400 hover:bg-white/[.05] hover:text-white",
            )}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
              {active ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/[.07] p-3">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-slate-400 transition hover:bg-white/[.05] hover:text-white"><Home className="h-[18px] w-[18px]" />Saytga qaytish</Link>
        <button type="button" onClick={() => signOut({ redirectTo: "/admin/login" })} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"><LogOut className="h-[18px] w-[18px]" />Chiqish</button>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.035] p-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 font-bold">A<span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0d1220] bg-emerald-400" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Admin</p><p className="text-[11px] text-slate-400">Super Admin</p></div>
          <MoreVertical className="h-4 w-4 text-slate-500" />
        </div>
        <button type="button" className="hidden w-full items-center gap-2 px-3 pt-2 text-xs text-slate-500 lg:flex"><ChevronLeft className="h-3.5 w-3.5" />Qisqartirish</button>
      </div>
    </aside>
  );
}
