"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, List, VideoOff } from "lucide-react";
import type { Movie, Episode } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";

export default function SerialTomashaClient({ serial, initialSeason, initialEpisode }: { serial: Movie; initialSeason?: number; initialEpisode?: number }) {
  const searchParams = useSearchParams();
  const epNum = parseInt(searchParams.get("ep") ?? String(initialEpisode ?? "1"));

  // Haqiqiy qismlar (admin qo'shgan). Bo'lmasa — serialning o'z videosidan bitta qism
  const eps: Episode[] =
    serial.episodes && serial.episodes.length > 0
      ? [...serial.episodes].sort((a, b) => (a.season - b.season) || (a.episode - b.episode))
      : [{ id: "1", movieId: serial.id, season: 1, episode: 1, title: "1-qism", videoUrl: serial.videoUrl, duration: serial.duration, viewCount: 0 }];

  const currentEp = eps.find((e) => e.episode === epNum && (initialSeason === undefined || e.season === initialSeason)) ?? eps[0];
  const videoSrc = currentEp.videoUrl || serial.videoUrl;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0a0a0f", borderBottom: "1px solid var(--border)" }}>
        <Link href={`/serial/${serial.slug}`} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">{serial.title}</span>
        </Link>
        <span className="text-gray-400 text-sm">• {currentEp.episode}-qism{currentEp.title ? `: ${currentEp.title}` : ""}</span>
      </div>

      {/* Player yoki "video yo'q" */}
      <div className="w-full max-w-[1100px] mx-auto">
        {videoSrc ? (
          <UzdubPlayer key={currentEp.id} src={videoSrc} poster={serial.backdropUrl || serial.posterUrl} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-3 text-center" style={{ aspectRatio: "16 / 9", background: "#0d0d12" }}>
            <VideoOff className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
            <p className="text-white font-medium">Bu qism uchun video havolasi qo&apos;shilmagan</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Admin panelda ushbu qismga video havolasini qo&apos;shing</p>
          </div>
        )}
      </div>

      {/* Info + episodes */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6" style={{ color: "var(--text-primary)" }}>
        <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
          {serial.title} — {currentEp.episode}-qism{currentEp.title ? `: ${currentEp.title}` : ""}
        </h1>
        {(serial.year || currentEp.duration) && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            {[serial.year, serial.country, serial.dubbing && `${serial.dubbing} tilida`, currentEp.duration && `${currentEp.duration} daqiqa`].filter(Boolean).join(" • ")}
          </p>
        )}
        {currentEp.description && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{currentEp.description}</p>
        )}

        {/* Episode list */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <List className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <span className="text-sm font-semibold text-white">Qismlar ({eps.length})</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {eps.map((ep) => (
              <Link key={ep.id} href={`/serial/${serial.slug}/qism/${ep.season}/${ep.episode}`}>
                <div
                  className="h-10 w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:scale-105"
                  style={{
                    background: ep.episode === currentEp.episode
                      ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                      : "var(--bg-tertiary)",
                    color: ep.episode === currentEp.episode ? "#fff" : "var(--text-muted)",
                    border: ep.episode === currentEp.episode ? "none" : "1px solid var(--border)",
                  }}
                  title={ep.title}
                >
                  {ep.episode}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
