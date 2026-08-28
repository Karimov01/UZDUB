"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Eye, MessageCircle, PlayCircle, Share2, ThumbsDown, ThumbsUp, VideoOff } from "lucide-react";
import type { Movie } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";
import DetailAdSlot from "@/components/ads/DetailAdSlot";
import WatchRecommendations from "@/components/player/WatchRecommendations";
import TelegramChannelButton from "@/components/shared/TelegramChannelButton";
import WatchComments, { type WatchReaction } from "@/components/player/WatchComments";
import { formatViewCount } from "@/lib/utils";

function duration(value?: number) { if (!value) return ""; return value >= 60 ? `${Math.floor(value / 60)} soat ${value % 60 ? `${value % 60} daqiqa` : ""}`.trim() : `${value} daqiqa`; }
function isDirect(url?: string) { return Boolean(url && /\.(mp4|m3u8|webm|mov)(?:$|[?#])/i.test(url)); }

export default function TomashaClient({ movie, recommendations = [] }: { movie: Movie; recommendations?: Movie[] }) {
  const commentsRef = useRef<HTMLElement>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [views, setViews] = useState(movie.viewCount ?? 0);
  const [reaction, setReaction] = useState<WatchReaction>({ likes: 0, dislikes: 0, myReaction: "", canVote: false });
  const poster = movie.posterUrl || movie.backdropUrl;
  const directVideo = isDirect(movie.videoUrl);

  useEffect(() => {
    const key = `uzdub_watch_page_viewed_${movie.id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch {}
    void fetch(`/api/public/view/${encodeURIComponent(movie.id)}`, { method: "POST", keepalive: true }).then((response) => response.ok ? response.json() : null).then((value) => { if (typeof value?.count === "number") setViews(value.count); }).catch(() => {});
  }, [movie.id]);

  const share = async () => {
    const payload = { title: `${movie.title} — UZDUB Play`, url: window.location.href };
    try { if (navigator.share) await navigator.share(payload); else { await navigator.clipboard.writeText(payload.url); alert("Havola nusxalandi"); } } catch {}
  };

  return <div className="min-h-screen bg-[#03040a] text-white">
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-10 pt-5 sm:px-6 md:pt-8">
      <section className="mb-5 flex gap-4 md:gap-6" aria-label="Kino haqida qisqa ma'lumot">
        {poster ? <div className="relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-xl border border-white/10 md:h-[146px] md:w-[104px]"><Image src={poster} alt={`${movie.title} posteri`} fill sizes="104px" className="object-cover" priority /></div> : null}
        <div className="min-w-0 py-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{movie.title} <span className="text-slate-400">{movie.year ? `(${movie.year})` : ""}</span></h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {movie.imdbRating ? <span className="rounded bg-[#f5c518] px-2 py-1 text-xs font-black text-black">IMDb</span> : null}
            {movie.imdbRating ? <b className="text-sm">{movie.imdbRating.toFixed(1)}</b> : null}
            {movie.genres?.slice(0, 3).map((genre) => <span key={genre.id} className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-xs text-slate-200">{genre.name}</span>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">{duration(movie.duration) && <span>{duration(movie.duration)}</span>} {movie.country && <span>{movie.country}</span>}<span>HD</span></div>
          <p className="mt-3 hidden max-w-3xl truncate text-sm text-slate-400 sm:block">{movie.shortDesc || movie.description}</p>
        </div>
      </section>

      <DetailAdSlot />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_70px_rgba(76,29,149,.18)]">
        {movie.videoUrl ? <UzdubPlayer src={movie.videoUrl} poster={movie.backdropUrl || movie.posterUrl} /> : <div className="flex aspect-video items-center justify-center gap-3 text-slate-400"><VideoOff className="h-9 w-9" />Video havolasi qo&apos;shilmagan</div>}
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid h-12 grid-cols-2 divide-x divide-white/10 rounded-xl border border-white/[.07] bg-white/[.045] md:w-[160px]">
          <button onClick={() => document.getElementById("watch-like")?.click()} className="flex items-center justify-center gap-2" aria-label="Yoqdi"><ThumbsUp className="h-5 w-5" />{reaction.likes}</button>
          <button onClick={() => document.getElementById("watch-dislike")?.click()} className="flex items-center justify-center gap-2" aria-label="Yoqmadi"><ThumbsDown className="h-5 w-5" />{reaction.dislikes}</button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex">
          {movie.trailerUrl ? <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="watch-action"><PlayCircle />Treyler</a> : null}
          {directVideo ? <a href={movie.videoUrl} download className="watch-action"><Download />Yuklab olish</a> : null}
          <button onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="watch-action"><MessageCircle />Izohlar</button>
          <button onClick={() => void share()} className="watch-action"><Share2 />Ulashish</button>
          <div className="watch-action" aria-label={`${formatViewCount(views)} marta ko'rildi`}><Eye />{formatViewCount(views)} ko&apos;rildi</div>
        </div>
      </div>

      <div className="mt-4 w-full"><TelegramChannelButton /></div>

      <section className="mt-5 rounded-2xl border border-white/[.08] bg-white/[.025] p-4 md:p-5">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setDescriptionOpen((v) => !v)} aria-expanded={descriptionOpen} aria-label={descriptionOpen ? "Tavsifni yopish" : "Tavsifni ochish"}><h2 className="text-base font-bold">Tavsif</h2><ChevronDown className={`h-5 w-5 text-slate-400 transition ${descriptionOpen ? "rotate-180" : ""}`} /></button>
        {descriptionOpen && <p className="mt-3 text-sm leading-6 text-slate-400">{movie.description}</p>}
      </section>

      <WatchComments ref={commentsRef} movie={movie} onReaction={setReaction} />
      <WatchRecommendations movies={recommendations} />
    </main>
  </div>;
}
