"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Play, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="admin-panel min-h-screen bg-[#070a13] text-white">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Menyuni yopish"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <header className="sticky top-0 z-30 flex h-[74px] items-center border-b border-white/[.08] bg-[#080b14]/95 px-4 backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Admin menyusini ochish" className="admin-icon-button mr-3">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 shadow-[0_0_28px_rgba(168,85,247,.28)]">
            <Play className="ml-0.5 h-5 w-5 fill-white" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold"><span className="gradient-text">UZDUB</span> Play</p>
            <p className="text-[11px] text-slate-400">Admin panel</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/kinolar" aria-label="Kontent qidirish" className="admin-icon-button"><Search className="h-5 w-5" /></Link>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-sm font-bold">A</span>
          <button type="button" aria-label="Yopish" onClick={() => setMobileOpen(false)} className="hidden"><X /></button>
        </div>
      </header>

      <main className="min-w-0 lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 lg:p-7 xl:p-8">{children}</div>
      </main>
    </div>
  );
}
