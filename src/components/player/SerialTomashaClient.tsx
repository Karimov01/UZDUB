"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, List, VideoOff } from "lucide-react";
import type { Movie } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";

const EPISODES = [
  { ep: 1, title: "Pilot", duration: 58 },
  { ep: 2, title: "Yangi boshlanish", duration: 52 },
  { ep: 3, title: "Haqiqat", duration: 60 },
  { ep: 4, title: "Sinov", duration: 55 },
  { ep: 5, title: "Qaror", duration: 63 },
  { ep: 6, title: "Burilish", duration: 57 },
  { ep: 7, title: "Sirlar ochiladi", duration: 61 },
  { ep: 8, title: "Yakuniy jang", duration: 70 },
];

export default function SerialTomashaClient({ serial }: { serial: Movie }) {
  const searchParams = useSearchParams();
  const epNum = parseInt(searchParams.get("ep") ?? "1");
  const currentEp = EPISODES.find((e) => e.ep === epNum) ?? EPISODES[0];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0a0a0f", borderBottom: "1px solid var(--border)" }}>
        <Link href={`/serial/${serial.slug}`} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">{serial.title}</span>
        </Link>
        <span className="text-gray-400 text-sm">• {currentEp.ep}-qism: {currentEp.title}</span>
      </div>

      {/* Player yoki "video yo'q" */}
      <div className="w-full max-w-[1100px] mx-auto">
        {serial.videoUrl ? (
          <UzdubPlayer src={serial.videoUrl} poster={serial.backdropUrl || serial.posterUrl} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-3 text-center" style={{ aspectRatio: "16 / 9", background: "#0d0d12" }}>
            <VideoOff className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
            <p className="text-white font-medium">Video havolasi qo&apos;shilmagan</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Admin panelda ushbu serialga video havolasini qo&apos;shing</p>
          </div>
        )}
      </div>

      {/* Info + episodes */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6" style={{ color: "var(--text-primary)" }}>
        <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
          {serial.title} — {currentEp.ep}-qism: {currentEp.title}
        </h1>
        {serial.year && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            {serial.year} • {serial.country} • {serial.dubbing} tilida • {currentEp.duration} daqiqa
          </p>
        )}

        {/* Episode list */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <List className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <span className="text-sm font-semibold text-white">1-mavsum qismlari</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {EPISODES.map((ep) => (
              <Link key={ep.ep} href={`/serial/${serial.slug}/tomosha?ep=${ep.ep}`}>
                <div
                  className="h-10 w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:scale-105"
                  style={{
                    background: ep.ep === epNum
                      ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                      : "var(--bg-tertiary)",
                    color: ep.ep === epNum ? "#fff" : "var(--text-muted)",
                    border: ep.ep === epNum ? "none" : "1px solid var(--border)",
                  }}
                >
                  {ep.ep}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
