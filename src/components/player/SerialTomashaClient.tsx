"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, List, Sparkles, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [episodeViews, setEpisodeViews] = useState(currentEp.viewCount ?? 0);
  const [showIndicator, setShowIndicator] = useState(true);
  useEffect(() => {
    const key = `uzdub_episode_viewed_${currentEp.id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { return; }
    fetch(`/api/public/episode-view/${serial.id}/${currentEp.id}`, { method: "POST" }).then((response) => response.json()).then((data) => { if (typeof data.count === "number") setEpisodeViews(data.count); }).catch(() => {});
  }, [currentEp.id, serial.id]);

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
      <div className="w-full max-w-[1120px] mx-auto px-3 md:px-0 pt-5 md:pt-8">
        <div className="relative rounded-2xl md:rounded-3xl p-px" style={{ background: "linear-gradient(135deg, rgba(192,132,252,0.9), rgba(124,58,237,0.15) 42%, rgba(236,72,153,0.75))", boxShadow: "0 0 22px rgba(124,58,237,0.42), 0 0 65px rgba(139,92,246,0.18)" }}>
          <div className="absolute -inset-4 -z-10 rounded-[2.2rem] opacity-70 blur-3xl" style={{ background: "radial-gradient(ellipse at 15% 15%, rgba(168,85,247,0.46), transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(236,72,153,0.28), transparent 48%)" }} />
          <div className="relative overflow-hidden rounded-[15px] md:rounded-[23px] bg-black" onPointerDownCapture={() => setShowIndicator(false)}>
        {videoSrc ? (
          <UzdubPlayer key={currentEp.id} src={videoSrc} poster={serial.backdropUrl || serial.posterUrl} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-3 text-center" style={{ aspectRatio: "16 / 9", background: "#0d0d12" }}>
            <VideoOff className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
            <p className="text-white font-medium">Bu qism uchun video havolasi qo&apos;shilmagan</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Admin panelda ushbu qismga video havolasini qo&apos;shing</p>
          </div>
        )}
        {showIndicator && <div
          className="absolute left-3 top-3 md:left-5 md:top-5 z-10 flex items-center gap-2.5 rounded-2xl p-2 pr-4 backdrop-blur-xl"
          style={{ background: "linear-gradient(135deg, rgba(20,12,35,0.9), rgba(12,12,20,0.82))", border: "1px solid rgba(196,132,252,0.75)", boxShadow: "0 0 22px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.14)" }}
        >
          <div className="h-11 w-11 md:h-16 md:w-16 rounded-lg md:rounded-xl flex items-center justify-center text-2xl md:text-4xl font-black text-white" style={{ background: "linear-gradient(145deg, #a855f7, #4c1d95 60%, #16052d)", boxShadow: "inset 0 1px 10px rgba(255,255,255,0.3), 0 5px 16px rgba(96,33,180,0.65)", fontFamily: "var(--font-display)" }}>{currentEp.episode}</div>
          <div className="leading-tight"><p className="text-sm md:text-base font-bold text-white">{currentEp.episode}-qism</p><p className="text-[11px] md:text-xs mt-1" style={{ color: "#d8b4fe" }}>Jami {eps.length}-qism</p></div>
        </div>}
          </div>
        </div>
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
        <p className="flex items-center gap-1 text-xs mb-4" style={{ color: "var(--text-muted)" }}><Eye className="h-3.5 w-3.5" /> {episodeViews} marta ko&apos;rildi</p>
        {currentEp.description && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{currentEp.description}</p>
        )}

        {/* Episode list */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <List className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <span className="text-sm font-semibold text-white">Qismlar ({eps.length})</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}>
            {eps.map((ep) => (
              <Link key={ep.id} href={`/serial/${serial.slug}/qism/${ep.season}/${ep.episode}`}>
                <div
                  className="h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:-translate-y-0.5 hover:text-white"
                  style={{
                    background: ep.episode === currentEp.episode
                      ? "linear-gradient(135deg, #A855F7, #6D28D9)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
                    color: ep.episode === currentEp.episode ? "#fff" : "var(--text-muted)",
                    border: ep.episode === currentEp.episode ? "1px solid rgba(216,180,254,0.9)" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: ep.episode === currentEp.episode ? "0 4px 18px rgba(139,92,246,0.5)" : "none",
                  }}
                  title={ep.title}
                >
                  {ep.episode}
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}><Sparkles className="h-3.5 w-3.5 text-violet-400" /> Hozir {currentEp.episode}-qism ijro etilmoqda</p>
        </div>
      </div>
    </div>
  );
}
