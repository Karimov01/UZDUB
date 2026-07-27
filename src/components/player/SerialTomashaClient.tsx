"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Play, SkipForward, SkipBack, Volume2, Maximize, Settings, List } from "lucide-react";
import type { Movie } from "@/types/movie";

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
  const prevEp = EPISODES.find((e) => e.ep === epNum - 1);
  const nextEp = EPISODES.find((e) => e.ep === epNum + 1);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      {/* Player */}
      <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
        {serial.backdropUrl && (
          <img src={serial.backdropUrl} alt={serial.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-3" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
          <Link href={`/serial/${serial.slug}`} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{serial.title}</span>
          </Link>
          <span className="text-gray-400 text-sm">• {currentEp.ep}-qism: {currentEp.title}</span>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
          <div className="w-full h-1 rounded-full mb-3 cursor-pointer" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="h-full rounded-full" style={{ width: "20%", background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-gray-300 disabled:opacity-30" disabled={!prevEp}>
                {prevEp ? (
                  <Link href={`/serial/${serial.slug}/tomosha?ep=${prevEp.ep}`}>
                    <SkipBack className="h-5 w-5" />
                  </Link>
                ) : <SkipBack className="h-5 w-5" />}
              </button>
              <button className="text-white hover:text-gray-300"><Play className="h-6 w-6 fill-white" /></button>
              <button className="text-white hover:text-gray-300 disabled:opacity-30" disabled={!nextEp}>
                {nextEp ? (
                  <Link href={`/serial/${serial.slug}/tomosha?ep=${nextEp.ep}`}>
                    <SkipForward className="h-5 w-5" />
                  </Link>
                ) : <SkipForward className="h-5 w-5" />}
              </button>
              <button className="text-white hover:text-gray-300"><Volume2 className="h-5 w-5" /></button>
              <span className="text-sm text-gray-300">12:40 / {currentEp.duration}:00</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-gray-300"><Settings className="h-5 w-5" /></button>
              <button className="text-white hover:text-gray-300"><Maximize className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
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
