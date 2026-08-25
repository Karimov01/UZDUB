"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, House, Menu, Play, Search, Sparkles, Trophy, Tv, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Asosiy", href: "/", icon: House },
  { label: "Kino", href: "/kino", icon: Clapperboard },
  { label: "Serial", href: "/serial", icon: Tv },
  { label: "Multfilm", href: "/janr/multfilm", icon: Sparkles },
  { label: "Top", href: "/top", icon: Trophy },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string | null } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const loadSession = () => fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((session) => setUser(session?.user ?? null))
      .catch(() => setUser(null));
    const idle = window.requestIdleCallback?.(loadSession, { timeout: 1800 });
    const timeout = idle === undefined ? window.setTimeout(loadSession, 500) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const profileHref = user ? "/profilim" : "/kirish";
  const logo = <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="UZDUB Play bosh sahifasi">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-pink-500"><Play className="h-4 w-4 fill-white text-white" /></span>
    <span className="whitespace-nowrap text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}><span className="gradient-text">UZDUB</span><span className="text-white"> Play</span></span>
  </Link>;

  return <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.07] bg-[rgba(8,9,14,.96)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="relative flex h-14 items-center gap-2 md:h-16 md:gap-5">
          <button type="button" aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"} className="rounded-lg p-1.5 text-gray-300 hover:bg-white/8 hover:text-white md:hidden" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}</button>
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">{logo}</div>

          <form action="/qidirish" className="hidden h-10 min-w-[190px] max-w-[330px] flex-1 items-center rounded-xl border border-white/10 bg-white/[.035] px-3 transition-colors focus-within:border-white/25 lg:flex">
            <Search className="h-4 w-4 shrink-0 text-gray-500" />
            <input name="q" type="search" placeholder="Qidirish..." className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-gray-500" aria-label="Kino yoki serial qidirish" />
          </form>

          <nav className="hidden h-full items-center gap-0.5 md:flex">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = isActive(pathname, href);
              return <Link key={href} href={href} className={cn("relative flex h-full items-center gap-1.5 px-2.5 text-sm font-medium transition-colors xl:px-3.5", active ? "text-white" : "text-gray-400 hover:text-white")}><Icon className="h-4 w-4" />{label}{active ? <span className="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-amber-400" /> : null}</Link>;
            })}
          </nav>

          <div className="flex-1 md:hidden" />
          <Link href="/qidirish" className="rounded-lg p-1.5 text-gray-300 hover:bg-white/8 hover:text-white lg:hidden" aria-label="Qidirish"><Search className="h-[22px] w-[22px]" /></Link>
          <Link href={profileHref} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-amber-400 md:h-10 md:w-10" aria-label={user ? "Profilim" : "Kirish"}><User className="h-[18px] w-[18px] md:h-5 md:w-5" /></Link>
        </div>
      </div>
    </header>

    {mobileOpen ? <div className="fixed inset-0 z-40 bg-[rgba(8,9,14,.985)] pt-14 md:hidden">
      <nav className="flex flex-col gap-1 p-4">
        {NAV_LINKS.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium", isActive(pathname, href) ? "bg-amber-400/10 text-amber-300" : "text-gray-300")}><Icon className="h-5 w-5" />{label}</Link>)}
        <Link href={profileHref} className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"><User className="h-5 w-5" />{user ? "Profilim" : "Kirish"}</Link>
      </nav>
    </div> : null}
  </>;
}
