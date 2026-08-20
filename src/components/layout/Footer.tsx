import Link from "next/link";
import { Play, PlayCircle, MessageCircle, Globe } from "lucide-react";
import LiveInternetCounter from "@/components/analytics/LiveInternetCounter";

const footerLinks = {
  Kontent: [
    { label: "Kinolar", href: "/kino" },
    { label: "Seriallar", href: "/serial" },
    { label: "Multfilmlar", href: "/janr/multfilm" },
    { label: "Janrlar", href: "/janr" },
    { label: "Top Kinolar", href: "/top" },
  ],
  Janrlar: [
    { label: "Drama", href: "/janr/drama" },
    { label: "Komediya", href: "/janr/komediya" },
    { label: "Triller", href: "/janr/triller" },
    { label: "Ilmiy Fantastika", href: "/janr/ilmiy-fantastika" },
    { label: "Harakatli", href: "/janr/harakatli" },
  ],
  Kompaniya: [
    { label: "Biz haqimizda", href: "/haqimizda" },
    { label: "Bog'lanish", href: "/boglanish" },
    { label: "Maxfiylik siyosati", href: "/maxfiylik" },
    { label: "Foydalanish shartlari", href: "/shartlar" },
  ],
};

export default function Footer() {
  return (
    <footer
      className="mt-auto pt-16 pb-8"
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
              >
                <Play className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                <span className="gradient-text">UZDUB</span>
                <span className="text-white"> Play</span>
              </span>
            </Link>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              O&apos;zbekistonning eng premium kino va serial platformasi. HD sifatda, o&apos;zbek tilida.
            </p>
            <div className="flex gap-3">
              <a
                href="https://t.me/Uzdubplay_bot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UZDUB Play Telegram boti"
                className="p-2 rounded-lg transition-all hover:bg-white/8"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                <PlayCircle className="h-4 w-4" />
              </a>
              <Link
                href="/boglanish"
                aria-label="UZDUB Play bilan bog'lanish"
                className="p-2 rounded-lg transition-all hover:bg-white/8"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
              <Link
                href="/haqimizda"
                aria-label="UZDUB Play haqida"
                className="p-2 rounded-lg transition-all hover:bg-white/8"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                <Globe className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h2
                className="font-semibold mb-4 text-sm"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                {title}
              </h2>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2026 UZDUB Play. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex items-center gap-3"><p className="text-xs" style={{ color: "var(--text-muted)" }}>O&apos;zbekiston, Toshkent</p><LiveInternetCounter /></div>
        </div>
      </div>
    </footer>
  );
}
