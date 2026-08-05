"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User, Menu, X, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string | null } | null>(null);
  const pathname = usePathname();

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

  const profileLabel = user?.name?.split(" ")[0] || "Profilim";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "backdrop-blur-xl border-b"
            : "bg-transparent"
        )}
        style={
          scrolled
            ? {
                background: "rgba(10, 10, 15, 0.92)",
                borderColor: "var(--border)",
              }
            : undefined
        }
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex items-center h-16 md:h-[72px] gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
              >
                <Play className="h-4 w-4 text-white fill-white" />
              </div>
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span className="gradient-text">UZDUB</span>
                <span className="text-white"> Play</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname === link.href
                      ? "text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/8"
                  )}
                  style={
                    pathname === link.href
                      ? { color: "var(--accent-violet)" }
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/qidirish"
                aria-label="Qidirish"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <Search className="h-5 w-5" />
              </Link>

              <button type="button" aria-label="Bildirishnomalar" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all hidden sm:flex">
                <Bell className="h-5 w-5" />
              </button>

              <Link href={user ? "/profilim" : "/kirish"} className="min-w-[104px]">
                <Button size="sm" className="hidden sm:flex w-full justify-center">
                  <User className="h-4 w-4" />
                  {user ? profileLabel : "Kirish"}
                </Button>
              </Link>

              <button
                type="button"
                aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden pt-16"
          style={{ background: "rgba(10, 10, 15, 0.98)" }}
        >
          <nav className="flex flex-col p-4 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-base font-medium transition-all",
                  pathname === link.href
                    ? "text-white"
                    : "text-gray-400"
                )}
                style={
                  pathname === link.href
                    ? {
                        background: "rgba(124, 58, 237, 0.15)",
                        color: "var(--accent-violet)",
                      }
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <Link href={user ? "/profilim" : "/kirish"} onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="lg">
                  <User className="h-4 w-4" />
                  {user ? "Profilim" : "Kirish"}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
