"use client";

import { useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Flame, Home, LogIn, Menu, Search, Sparkles, Star, Tv, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }> };
const NAV_LINKS: NavItem[] = [
  { label: "Asosiy", href: "/", icon: Home },
  { label: "Kino", href: "/kino", icon: Clapperboard },
  { label: "Serial", href: "/serial", icon: Tv },
  { label: "Multfilm", href: "/janr/multfilm", icon: Star },
  { label: "Mashhur", href: "/top", icon: Flame },
  { label: "Yangi", href: "/tez-kunda", icon: Sparkles },
];
function isActive(pathname: string, href: string) { return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`); }

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string | null } | null>(null);
  const pathname = usePathname();
  useEffect(() => { const load = () => fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((s) => setUser(s?.user ?? null)).catch(() => setUser(null)); const idle = window.requestIdleCallback?.(load, { timeout: 1800 }); const timeout = idle === undefined ? window.setTimeout(load, 500) : undefined; return () => { if (idle !== undefined) window.cancelIdleCallback?.(idle); if (timeout !== undefined) window.clearTimeout(timeout); }; }, []);
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);
  const profileHref = user ? "/profilim" : "/kirish";
  const initial = user?.name?.trim().charAt(0).toUpperCase();
  return <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.06] bg-[#0b0c10]/95 backdrop-blur-xl"><div className="mx-auto max-w-[1400px] px-4 md:px-7"><div className="relative flex h-14 items-center gap-3 md:h-16">
      <button type="button" aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/[.06] md:hidden" onClick={() => setMobileOpen((v) => !v)}>{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 md:static md:mr-5 md:translate-x-0" aria-label="UZDUB Play bosh sahifasi"><Image src="/favicon.svg" alt="" width={36} height={36} className="h-8 w-8 rounded-lg md:h-9 md:w-9" priority /><span className="whitespace-nowrap text-lg font-bold md:text-xl"><span>UZDUB</span> <span className="gradient-text">PLAY</span></span></Link>
      <nav className="hidden h-full items-stretch md:flex">{NAV_LINKS.map(({ label, href, icon: Icon }) => { const active = isActive(pathname, href); return <Link key={href} href={href} className={cn("relative flex min-w-[66px] flex-col items-center justify-center gap-1 px-2 text-[11px] transition", active ? "text-fuchsia-300" : "text-slate-400 hover:text-white")}><Icon className="h-[18px] w-[18px]" /><span>{label}</span>{active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />}</Link>; })}</nav>
      <form action="/qidirish" className="ml-auto hidden h-10 max-w-[300px] flex-1 items-center rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-fuchsia-500/50 lg:flex"><Search className="mr-2 h-[18px] w-[18px] text-slate-500" /><input name="q" type="search" placeholder="Qidirish..." aria-label="Kino yoki serial qidirish" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" /></form>
      <div className="ml-auto flex items-center gap-2 lg:ml-4"><Link href="/qidirish" className="p-1.5 text-slate-300 lg:hidden" aria-label="Qidirish"><Search className="h-6 w-6" /></Link><Link href={profileHref} className={cn("flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold md:h-10 md:w-auto md:gap-2 md:rounded-xl md:px-3", user ? "border-fuchsia-400/40 bg-fuchsia-500/15" : "border-white/10 bg-white/[.04]")} aria-label={user ? "Profilim" : "Kirish"}>{initial || <User className="h-[18px] w-[18px]" />}<span className="hidden md:inline">{user ? "Profilim" : "Kirish"}</span></Link></div>
    </div></div></header>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-[#0b0c10] pt-14 md:hidden"><div className="flex h-full flex-col overflow-y-auto p-4"><nav className="space-y-2">{NAV_LINKS.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={cn("flex min-h-14 items-center gap-3 rounded-xl border px-3 font-semibold", isActive(pathname, href) ? "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200" : "border-white/[.04] bg-black/25 text-slate-100")}><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[.06] bg-white/[.055]"><Icon className="h-5 w-5 text-slate-300" /></span>{label}</Link>)}</nav><Link href={profileHref} className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold text-white"><LogIn className="h-5 w-5" />{user ? "Profilim" : "Kirish"}</Link></div></div>}
  </>;
}
