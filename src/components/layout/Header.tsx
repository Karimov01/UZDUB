"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, House, Menu, Play, Search, Sparkles, Tv, User, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import Button from "@/components/ui/Button";

const HOME_NAV_LINKS = [
  { label: "Asosiy", href: "/", icon: House },
  { label: "Kino", href: "/kino", icon: Clapperboard },
  { label: "Serial", href: "/serial", icon: Tv },
  { label: "Multfilm", href: "/janr/multfilm", icon: Sparkles },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string | null } | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const profileLabel = user?.name?.split(" ")[0] || "Profilim";
  const profileHref = user ? "/profilim" : "/kirish";
  const logo = (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="UZDUB Play bosh sahifasi">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
        <Play className="h-4 w-4 fill-white text-white" />
      </div>
      <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        <span className="gradient-text">UZDUB</span><span className="text-white"> Play</span>
      </span>
    </Link>
  );

  return (
    <>
      <header
        className={cn("fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300", !isHome && !scrolled && "border-transparent bg-transparent")}
        style={isHome || scrolled ? { background: "rgba(8,9,14,.96)", borderColor: "rgba(255,255,255,.08)", backdropFilter: "blur(18px)" } : undefined}
      >
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          {isHome ? (
            <div className="relative flex h-16 items-center gap-3 md:gap-7">
              <button type="button" aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"} className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/8 hover:text-white md:hidden" onClick={() => setMobileOpen((open) => !open)}>
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">{logo}</div>
              <nav className="hidden h-full items-center gap-1 md:flex">
                {HOME_NAV_LINKS.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href;
                  return <Link key={href} href={href} className={cn("relative flex h-full items-center gap-2 px-4 text-sm font-medium transition-colors", active ? "text-white" : "text-gray-400 hover:text-white")}><Icon className="h-[18px] w-[18px]" />{label}{active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-fuchsia-400" /> : null}</Link>;
                })}
              </nav>
              <div className="flex-1" />
              <Link href="/qidirish" className="hidden h-10 w-[220px] items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 text-sm text-gray-400 transition-colors hover:border-white/20 hover:text-white md:flex" aria-label="Qidirish"><Search className="h-4 w-4" />Qidirish</Link>
              <Link href="/qidirish" className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/8 hover:text-white md:hidden" aria-label="Qidirish"><Search className="h-6 w-6" /></Link>
              <Link href={profileHref} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-fuchsia-400" aria-label={user ? "Profilim" : "Kirish"}><User className="h-5 w-5" /></Link>
            </div>
          ) : (
            <div className="flex h-16 items-center gap-6 md:h-[72px]">
              {logo}
              <nav className="ml-4 hidden items-center gap-1 md:flex">
                {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200", pathname === link.href ? "text-white" : "text-gray-400 hover:bg-white/8 hover:text-white")} style={pathname === link.href ? { color: "var(--accent-violet)" } : undefined}>{link.label}</Link>)}
              </nav>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Link href="/qidirish" aria-label="Qidirish" className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white/8 hover:text-white"><Search className="h-5 w-5" /></Link>
                <button type="button" aria-label="Bildirishnomalar" className="hidden rounded-lg p-2 text-gray-400 transition-all hover:bg-white/8 hover:text-white sm:flex"><Bell className="h-5 w-5" /></button>
                <Link href={profileHref} className="hidden min-w-[104px] sm:block" aria-label={user ? "Profilim" : "Kirish"}><Button size="sm" className="hidden w-full justify-center sm:flex"><User className="h-4 w-4" />{user ? profileLabel : "Kirish"}</Button></Link>
                <button type="button" aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"} className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white/8 hover:text-white md:hidden" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-[rgba(8,9,14,.985)] pt-16 md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {(isHome ? HOME_NAV_LINKS : NAV_LINKS).map((link) => (
              <Link key={link.href} href={link.href} className={cn("rounded-xl px-4 py-3 text-base font-medium", pathname === link.href ? "bg-violet-500/15 text-violet-300" : "text-gray-300")}>
                {link.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-white/10 pt-4"><Link href={profileHref}><Button className="w-full" size="lg"><User className="h-4 w-4" />{user ? "Profilim" : "Kirish"}</Button></Link></div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
