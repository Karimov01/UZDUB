import type { Metadata } from "next";
import Link from "next/link";
import { Play } from "lucide-react";

export const metadata: Metadata = { title: "Kirish" };

export default function KirishPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div
        className="w-full max-w-md p-8 rounded-3xl"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
          >
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="gradient-text">UZDUB</span>
            <span className="text-white"> Play</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Xush kelibsiz!
        </h1>
        <p className="text-center mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Kirish uchun Telegram hisobingizdan foydalaning
        </p>

        {/* Telegram login button */}
        <button
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] mb-4"
          style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram orqali kirish
        </button>

        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Kirib, siz{" "}
          <Link href="/shartlar" className="hover:text-white transition-colors" style={{ color: "var(--accent-violet)" }}>
            foydalanish shartlari
          </Link>
          {" "}ga rozilik bildirasiz
        </p>
      </div>
    </div>
  );
}
