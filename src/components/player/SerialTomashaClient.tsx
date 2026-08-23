"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, Play, Sparkles, VideoOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Episode, Movie } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";
import SeasonEpisodeSelector, { normalizeEpisodes } from "@/components/serial/SeasonEpisodeSelector";
import EngagementPanel from "@/components/engagement/EngagementPanel";
import TelegramChannelButton from "@/components/shared/TelegramChannelButton";

function normalizedTitle(value?: string) {
  return (value ?? "").toLowerCase().replace(/[’‘`']/g, "'").replace(/\s+/g, " ").trim();
}

export default function SerialTomashaClient({ serial, initialSeason, initialEpisode }: { serial: Movie; initialSeason?: number; initialEpisode?: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedEpisode = Number.parseInt(searchParams.get("ep") ?? String(initialEpisode ?? 1), 10);
  const episodes: Episode[] = serial.episodes?.length ? normalizeEpisodes(serial.episodes) : [{ id: "1", movieId: serial.id, season: 1, episode: 1, title: "1-qism", videoUrl: serial.videoUrl, duration: serial.duration, viewCount: 0 }];
  const currentEpisode = episodes.find((episode) => episode.episode === requestedEpisode && (initialSeason === undefined || episode.season === initialSeason)) ?? episodes[0];
  const playableEpisodes = episodes.filter((episode) => Boolean(episode.videoUrl?.trim()));
  const navigationIndex = playableEpisodes.findIndex((episode) => episode.id === currentEpisode.id);
  const previousEpisode = navigationIndex > 0 ? playableEpisodes[navigationIndex - 1] : undefined;
  const nextEpisode = navigationIndex >= 0 ? playableEpisodes[navigationIndex + 1] : undefined;
  const currentSeasonCount = episodes.filter((episode) => episode.season === currentEpisode.season).length;
  const [episodeViews, setEpisodeViews] = useState(currentEpisode.viewCount ?? 0);
  const [showIndicator, setShowIndicator] = useState(true);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);

  const episodeTitle = normalizedTitle(currentEpisode.title);
  const serialTitle = normalizedTitle(serial.title);
  const genericTitle = !episodeTitle || episodeTitle === serialTitle || episodeTitle === `${currentEpisode.episode}-qism` || episodeTitle.includes(`${currentEpisode.episode}-qism ${serialTitle}`);
  const heading = `${serial.title} — ${currentEpisode.season}-fasl, ${currentEpisode.episode}-qism${genericTitle ? "" : `: ${currentEpisode.title}`}`;
  const videoUrl = currentEpisode.videoUrl || serial.videoUrl;
  const goToEpisode = (episode: Episode) => router.push(`/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`);

  useEffect(() => {
    setEpisodeViews(currentEpisode.viewCount ?? 0);
    const key = `uzdub_watch_page_viewed_${serial.id}_${currentEpisode.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage ishlamasa ham ushbu ochilishda faqat bitta so'rov yuboriladi.
    }
    void fetch(`/api/public/episode-view/${encodeURIComponent(serial.id)}/${encodeURIComponent(currentEpisode.id)}`, { method: "POST", keepalive: true })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (typeof data?.count === "number") setEpisodeViews(data.count); })
      .catch(() => {});
  }, [currentEpisode.id, currentEpisode.viewCount, serial.id]);

  useEffect(() => { setNextCountdown(null); }, [currentEpisode.id]);
  useEffect(() => {
    if (nextCountdown === null || !nextEpisode) return;
    if (nextCountdown <= 0) { goToEpisode(nextEpisode); return; }
    const timer = window.setTimeout(() => setNextCountdown((value) => value === null ? null : value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [nextCountdown, nextEpisode]);

  return <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0a0a0f", borderBottom: "1px solid var(--border)" }}><Link href={`/serial/${serial.slug}`} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"><ChevronLeft className="h-5 w-5" /><span className="text-sm font-medium">{serial.title}</span></Link><span className="text-gray-400 text-sm">• {currentEpisode.episode}-qism</span></div>
    <main className="mx-auto grid w-full max-w-[1400px] gap-5 px-3 pb-7 pt-5 md:px-5 md:pt-8 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-200"><span className="rounded-full px-2.5 py-1" style={{ background: "rgba(124,58,237,.2)", border: "1px solid rgba(196,132,252,.28)" }}>✦ SERIAL PLAYER</span><span style={{ color: "var(--text-muted)" }}>{currentEpisode.season}-fasl · {currentEpisode.episode}-qism</span></div>
        <div className="relative rounded-2xl p-px md:rounded-3xl" style={{ background: "linear-gradient(135deg,rgba(192,132,252,.9),rgba(124,58,237,.15) 42%,rgba(236,72,153,.75))", boxShadow: "0 0 22px rgba(124,58,237,.42),0 0 65px rgba(139,92,246,.18)" }}><div className="absolute -inset-4 -z-10 rounded-[2.2rem] opacity-70 blur-3xl" style={{ background: "radial-gradient(ellipse at 15% 15%,rgba(168,85,247,.46),transparent 45%),radial-gradient(ellipse at 85% 90%,rgba(236,72,153,.28),transparent 48%)" }} /><div className="relative overflow-hidden rounded-[15px] bg-black md:rounded-[23px]" onPointerDownCapture={() => setShowIndicator(false)}>{videoUrl ? <UzdubPlayer key={currentEpisode.id} src={videoUrl} poster={serial.backdropUrl || serial.posterUrl} movieId={serial.id} episodeId={currentEpisode.id} onEnded={nextEpisode ? () => setNextCountdown(5) : undefined} /> : <div className="flex w-full flex-col items-center justify-center gap-3 text-center" style={{ aspectRatio: "16 / 9", background: "#0d0d12" }}><VideoOff className="h-10 w-10" style={{ color: "var(--text-muted)" }} /><p className="font-medium text-white">Bu qism uchun video havolasi qo&apos;shilmagan</p></div>}{showIndicator && <div className="absolute left-3 top-3 z-10 flex items-center gap-2.5 rounded-2xl p-2 pr-4 backdrop-blur-xl md:left-5 md:top-5" style={{ background: "linear-gradient(135deg,rgba(20,12,35,.9),rgba(12,12,20,.82))", border: "1px solid rgba(196,132,252,.75)", boxShadow: "0 0 22px rgba(139,92,246,.45),inset 0 1px 0 rgba(255,255,255,.14)" }}><div className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl font-black text-white md:h-16 md:w-16 md:rounded-xl md:text-4xl" style={{ background: "linear-gradient(145deg,#a855f7,#4c1d95 60%,#16052d)", boxShadow: "inset 0 1px 10px rgba(255,255,255,.3),0 5px 16px rgba(96,33,180,.65)" }}>{currentEpisode.episode}</div><div className="leading-tight"><p className="text-sm font-bold text-white md:text-base">{currentEpisode.season}-fasl, {currentEpisode.episode}-qism</p><p className="mt-1 text-[11px] md:text-xs" style={{ color: "#d8b4fe" }}>Bu faslda {currentSeasonCount} qism</p></div></div>}{nextCountdown !== null && nextEpisode && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-3xl p-5 text-center" style={{ background: "linear-gradient(145deg,rgba(31,18,58,.98),rgba(10,10,18,.98))", border: "1px solid rgba(216,180,254,.7)", boxShadow: "0 0 44px rgba(139,92,246,.5)" }}><Sparkles className="mx-auto h-7 w-7 text-violet-200" /><p className="mt-3 text-sm text-violet-200">Keyingi qism boshlanmoqda</p><h2 className="mt-1 text-xl font-bold text-white">{nextEpisode.episode}-qism</h2><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{nextCountdown} soniyadan keyin avtomatik ochiladi</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => goToEpisode(nextEpisode)} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}><Play className="mr-2 inline h-4 w-4 fill-white" />Hozir ochish</button><button type="button" onClick={() => setNextCountdown(null)} className="rounded-xl px-3 text-white" style={{ border: "1px solid rgba(255,255,255,.17)" }}><X className="h-4 w-4" /></button></div></div></div>}</div></div>
        <nav className="mt-3 flex w-full gap-3 md:mt-4" aria-label="Qismlar navigatsiyasi"><div className="flex-1">{previousEpisode ? <Link href={`/serial/${serial.slug}/qism/${previousEpisode.season}/${previousEpisode.episode}`} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-violet-200 transition hover:border-violet-300/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:w-auto" style={{ border: "1px solid rgba(167,139,250,.3)", background: "rgba(124,58,237,.1)" }}><ChevronLeft className="h-4 w-4" />Oldingi qism</Link> : <button type="button" disabled className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-violet-200 opacity-40 md:w-auto" style={{ border: "1px solid rgba(167,139,250,.2)", background: "rgba(124,58,237,.06)" }}><ChevronLeft className="h-4 w-4" />Oldingi qism</button>}</div><div className="flex flex-1 justify-end">{nextEpisode ? <Link href={`/serial/${serial.slug}/qism/${nextEpisode.season}/${nextEpisode.episode}`} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,92,246,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:w-auto" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "1px solid rgba(216,180,254,.72)" }}>Keyingi qism<ChevronRight className="h-4 w-4" /></Link> : <button type="button" disabled className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white opacity-40 md:w-auto" style={{ background: "rgba(124,58,237,.22)", border: "1px solid rgba(216,180,254,.3)" }}>Keyingi qism<ChevronRight className="h-4 w-4" /></button>}</div></nav>
        <div className="w-full pb-2 pt-4 md:pt-5"><h1 className="mb-1 text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{heading}</h1><p className="mb-2 text-sm" style={{ color: "var(--text-muted)" }}>{[serial.year, serial.country, serial.dubbing && `${serial.dubbing} tilida`, currentEpisode.duration && `${currentEpisode.duration} daqiqa`].filter(Boolean).join(" · ")}</p><p className="mb-4 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}><Eye className="h-3.5 w-3.5" />{episodeViews} marta ko&apos;rildi</p>{currentEpisode.description && <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{currentEpisode.description}</p>}
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]"><section className="flex min-w-0 gap-3 rounded-2xl p-3.5 md:p-4" style={{ background: "linear-gradient(145deg,rgba(25,18,42,.82),rgba(11,12,21,.94))", border: "1px solid rgba(167,139,250,.22)" }}>{serial.posterUrl && <div className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded-lg bg-black/30"><Image src={serial.posterUrl} alt="" fill sizes="68px" className="object-cover" /></div>}<div className="min-w-0 flex-1"><h2 className="truncate text-base font-bold text-white">{serial.title}</h2><p className="mt-2 text-sm text-violet-200">{serial.imdbRating ? `IMDb ${serial.imdbRating.toFixed(1)}` : "UZDUB Play"}{serial.internalRating ? ` · UZDUB ${serial.internalRating.toFixed(1)}` : ""}</p><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{[serial.country, serial.genres?.slice(0, 2).map((genre) => genre.name).join(", ")].filter(Boolean).join(" · ")}</p><Link href={`/serial/${serial.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm text-violet-200 hover:text-white"><ChevronLeft className="h-4 w-4" />Serial sahifasiga qaytish</Link></div></section><TelegramChannelButton /></div>
        </div>
      </div>
      <aside className="min-w-0 xl:sticky xl:top-5 xl:self-start" aria-label="Fasllar va qismlar"><SeasonEpisodeSelector slug={serial.slug} episodes={playableEpisodes} activeSeason={currentEpisode.season} activeEpisode={currentEpisode.episode} compact title={serial.title} sidebar fallbackImage={serial.backdropUrl || serial.posterUrl} /></aside>
    </main>
    <EngagementPanel content={serial} />
  </div>;
}
