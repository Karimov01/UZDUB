"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Sparkles, VideoOff } from "lucide-react";
import type { Movie } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";
import WatchRecommendations from "@/components/player/WatchRecommendations";
import EngagementPanel from "@/components/engagement/EngagementPanel";
import TelegramChannelButton from "@/components/shared/TelegramChannelButton";

function formatDuration(minutes?: number) { if (!minutes) return undefined; return minutes >= 60 ? `${Math.floor(minutes / 60)} soat ${minutes % 60 ? `${minutes % 60} daqiqa` : ""}`.trim() : `${minutes} daqiqa`; }
function formatViews(count?: number) { return new Intl.NumberFormat("uz-UZ", { notation: "compact", maximumFractionDigits: 1 }).format(count ?? 0); }

export default function TomashaClient({ movie, recommendations = [] }: { movie: Movie; recommendations?: Movie[] }) {
  const metadata = [movie.year, formatDuration(movie.duration), `${formatViews(movie.viewCount)} marta ko'rildi`].filter(Boolean);
  const poster = movie.posterUrl || movie.backdropUrl;

  return <div className="min-h-screen" style={{ background: "#000" }}>
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0a0a0f", borderBottom: "1px solid var(--border)" }}><Link href={`/kino/${movie.slug}`} className="flex items-center gap-2 text-white transition-colors hover:text-gray-300"><ChevronLeft className="h-5 w-5" /><span className="text-sm font-medium">{movie.title}</span></Link><span className="hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>Premium tomosha rejimi</span></div>
    <main className="mx-auto max-w-[1400px] px-3 pb-6 pt-5 md:px-5 md:pt-8"><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="min-w-0">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-200"><span className="rounded-full px-2.5 py-1" style={{ background: "rgba(124,58,237,.2)", border: "1px solid rgba(196,132,252,.28)" }}>✦ PREMIUM PLAYER</span><span style={{ color: "var(--text-muted)" }}>HD sifatda tomosha qiling</span></div>
      <div className="relative rounded-2xl p-px md:rounded-3xl" style={{ background: "linear-gradient(135deg,rgba(192,132,252,.9),rgba(124,58,237,.15) 42%,rgba(236,72,153,.75))", boxShadow: "0 0 22px rgba(124,58,237,.42),0 0 65px rgba(139,92,246,.18)" }}><div className="absolute -inset-4 -z-10 rounded-[2.2rem] opacity-70 blur-3xl" style={{ background: "radial-gradient(ellipse at 15% 15%,rgba(168,85,247,.46),transparent 45%),radial-gradient(ellipse at 85% 90%,rgba(236,72,153,.28),transparent 48%)" }} /><div className="overflow-hidden rounded-[15px] bg-black md:rounded-[23px]">{movie.videoUrl ? <UzdubPlayer src={movie.videoUrl} poster={movie.backdropUrl || movie.posterUrl} movieId={movie.id} /> : <div className="flex w-full flex-col items-center justify-center gap-3 text-center" style={{ aspectRatio: "16 / 9", background: "#0d0d12" }}><VideoOff className="h-10 w-10" style={{ color: "var(--text-muted)" }} /><p className="font-medium text-white">Video havolasi qo&apos;shilmagan</p></div>}</div></div>
      <section className="pt-5"><h1 className="text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{movie.title}</h1><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" style={{ color: "var(--text-muted)" }}><span className="rounded-md px-2 py-0.5 text-xs font-semibold text-violet-100" style={{ background: "rgba(124,58,237,.46)" }}>{movie.dubbing || "O'zbek tilida"}</span>{metadata.map((item) => <span key={item}>• {item}</span>)}</div></section>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px]"><section className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(145deg,rgba(25,18,42,.82),rgba(11,12,21,.94))", border: "1px solid rgba(167,139,250,.2)" }}><div className="flex items-start gap-3">{poster ? <div className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded-lg bg-black/30"><Image src={poster} alt="" fill sizes="68px" className="object-cover" /></div> : <div className="h-24 w-[68px] shrink-0 rounded-lg bg-gradient-to-br from-violet-950 to-slate-950" />}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs text-violet-200"><span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "rgba(124,58,237,.16)" }}><Sparkles className="h-3.5 w-3.5" />Premium tomosha</span>{movie.imdbRating ? <span>IMDb {movie.imdbRating.toFixed(1)}</span> : null}</div><h2 className="mt-3 text-lg font-bold text-white">{movie.title}</h2><p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{[movie.country, movie.genres?.slice(0, 3).map((genre) => genre.name).join(", ")].filter(Boolean).join(" · ")}</p><Link href={`/kino/${movie.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm text-violet-200 hover:text-white"><ChevronLeft className="h-4 w-4" />Sahifaga qaytish</Link></div></div></section><TelegramChannelButton /></div>
    </div><WatchRecommendations movies={recommendations} /></div></main>
    <EngagementPanel content={movie} />
  </div>;
}
