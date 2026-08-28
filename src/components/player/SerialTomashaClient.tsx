"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Eye, MessageCircle, Mic, Play, Share2, ThumbsDown, ThumbsUp, Video, VideoOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Episode, Movie } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";
import DetailAdSlot from "@/components/ads/DetailAdSlot";
import SeasonEpisodeSelector, { normalizeEpisodes } from "@/components/serial/SeasonEpisodeSelector";
import WatchComments, { type WatchReaction } from "@/components/player/WatchComments";
import { formatViewCount } from "@/lib/utils";
import { isPublicDirectVideoUrl } from "@/lib/video-seo";

function episodeHref(slug: string, episode: Episode) {
  return `/serial/${slug}/qism/${episode.season}/${episode.episode}`;
}

export default function SerialTomashaClient({ serial, initialSeason, initialEpisode }: { serial: Movie; initialSeason?: number; initialEpisode?: number }) {
  const commentsRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEpisode = Number.parseInt(searchParams.get("ep") ?? String(initialEpisode ?? 1), 10);
  const episodes: Episode[] = serial.episodes?.length ? normalizeEpisodes(serial.episodes) : [{ id: "1", movieId: serial.id, season: 1, episode: 1, title: "1-qism", videoUrl: serial.videoUrl, duration: serial.duration, viewCount: 0 }];
  const currentEpisode = episodes.find((item) => item.episode === requestedEpisode && (initialSeason === undefined || item.season === initialSeason)) ?? episodes[0];
  const playableEpisodes = episodes.filter((item) => Boolean(item.videoUrl?.trim()));
  const navigationIndex = playableEpisodes.findIndex((item) => item.id === currentEpisode.id);
  const previousEpisode = navigationIndex > 0 ? playableEpisodes[navigationIndex - 1] : undefined;
  const nextEpisode = navigationIndex >= 0 ? playableEpisodes[navigationIndex + 1] : undefined;
  const [episodeViews, setEpisodeViews] = useState(currentEpisode.viewCount ?? 0);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const [reaction, setReaction] = useState<WatchReaction>({ likes: 0, dislikes: 0, myReaction: "", canVote: false });
  const videoUrl = currentEpisode.videoUrl || serial.videoUrl;
  const directVideo = isPublicDirectVideoUrl(videoUrl);

  useEffect(() => {
    setEpisodeViews(currentEpisode.viewCount ?? 0);
    const key = `uzdub_watch_page_viewed_${serial.id}_${currentEpisode.id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch {}
    void fetch(`/api/public/episode-view/${encodeURIComponent(serial.id)}/${encodeURIComponent(currentEpisode.id)}`, { method: "POST", keepalive: true })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (typeof data?.count === "number") setEpisodeViews(data.count); })
      .catch(() => {});
  }, [currentEpisode.id, currentEpisode.viewCount, serial.id]);

  useEffect(() => { setNextCountdown(null); }, [currentEpisode.id]);
  useEffect(() => {
    if (nextCountdown === null || !nextEpisode) return;
    if (nextCountdown <= 0) { router.push(episodeHref(serial.slug, nextEpisode)); return; }
    const timer = window.setTimeout(() => setNextCountdown((value) => value === null ? null : value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [nextCountdown, nextEpisode, router, serial.slug]);

  const share = async () => {
    const data = { title: `${serial.title} ${currentEpisode.episode}-qism`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else await navigator.clipboard?.writeText(data.url).catch(() => {});
  };

  return <div className="min-h-screen bg-[#070910] text-white">
    <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 pb-8 pt-5 md:px-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <DetailAdSlot />

        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black">
          {videoUrl ? <UzdubPlayer key={currentEpisode.id} src={videoUrl} poster={currentEpisode.previewUrl || serial.backdropUrl || serial.posterUrl} onEnded={nextEpisode ? () => setNextCountdown(5) : undefined} /> : <div className="flex aspect-video flex-col items-center justify-center gap-3 text-gray-400"><VideoOff className="h-11 w-11" /><p>Bu qism uchun video havolasi qo‘shilmagan</p></div>}
          {nextCountdown !== null && nextEpisode ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-sm rounded-2xl border border-fuchsia-400/40 bg-[#11131d] p-5 text-center"><p className="text-gray-400">Keyingi qism {nextCountdown} soniyadan keyin ochiladi</p><h2 className="mt-2 text-xl font-bold">{nextEpisode.episode}-qism</h2><div className="mt-5 flex gap-2"><button type="button" onClick={() => router.push(episodeHref(serial.slug, nextEpisode))} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3 font-semibold"><Play className="mr-2 inline h-4 w-4 fill-white" />Ochish</button><button type="button" onClick={() => setNextCountdown(null)} className="rounded-xl border border-white/15 px-4"><X className="h-4 w-4" /></button></div></div></div> : null}
        </div>

        <nav className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3" aria-label="Qismlar navigatsiyasi">
          {previousEpisode ? <Link href={episodeHref(serial.slug, previousEpisode)} className="flex h-13 items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 text-sm font-medium hover:border-fuchsia-400/40"><ChevronLeft className="h-5 w-5" /><span className="hidden sm:inline">Oldingi qism</span></Link> : <span className="h-13 rounded-xl border border-white/[.05] bg-white/[.02]" />}
          <b className="px-2 text-sm text-gray-300">{currentEpisode.episode} / {episodes.filter((item) => item.season === currentEpisode.season).length}</b>
          {nextEpisode ? <Link href={episodeHref(serial.slug, nextEpisode)} className="flex h-13 items-center justify-end gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 text-sm font-medium hover:border-fuchsia-400/40"><span><small className="block text-gray-500">Keyingi qism</small>{nextEpisode.episode}-qism</span><ChevronRight className="h-5 w-5" /></Link> : <span className="h-13 rounded-xl border border-white/[.05] bg-white/[.02]" />}
        </nav>

        <div className="py-5">
          <h1 className="text-2xl font-bold md:text-3xl">{serial.title} <span className="text-gray-400">{currentEpisode.episode}-qism</span></h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-400">{serial.dubbing ? <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500 px-2.5 py-1 font-bold text-white"><Mic className="h-3.5 w-3.5" />UZ</span> : null}{currentEpisode.airDate ? <span>{new Date(currentEpisode.airDate).toLocaleDateString("uz-UZ")}</span> : null}{currentEpisode.duration ? <><span>·</span><span>{currentEpisode.duration} daq</span></> : null}<span>·</span><span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{formatViewCount(episodeViews)} ko‘rildi</span></p>
        </div>

        <div className="flex flex-col gap-3 border-y border-white/[.06] py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid h-12 grid-cols-2 divide-x divide-white/10 rounded-xl border border-white/[.07] bg-white/[.045] sm:w-[160px]">
            <button type="button" onClick={() => document.getElementById("watch-like")?.click()} className="flex items-center justify-center gap-2" aria-label="Yoqdi"><ThumbsUp className="h-5 w-5" />{reaction.likes}</button>
            <button type="button" onClick={() => document.getElementById("watch-dislike")?.click()} className="flex items-center justify-center gap-2" aria-label="Yoqmadi"><ThumbsDown className="h-5 w-5" />{reaction.dislikes}</button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {serial.trailerUrl ? <a href={serial.trailerUrl} target="_blank" rel="noreferrer" className="watch-action"><Video className="h-5 w-5" />Trailer</a> : null}
            {directVideo && videoUrl ? <a href={videoUrl} download className="watch-action"><Download className="h-5 w-5" />Yuklab olish</a> : null}
            <button type="button" onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="watch-action"><MessageCircle className="h-5 w-5" />Izohlar</button>
            <button type="button" onClick={share} className="watch-action"><Share2 className="h-5 w-5" />Ulashish</button>
          </div>
        </div>

        <section className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
          {serial.posterUrl ? <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg"><Image src={serial.posterUrl} alt={serial.title} fill className="object-cover" sizes="64px" /></div> : null}
          <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold">{serial.title}</h2><p className="mt-2 text-sm text-gray-400">{serial.country}{serial.imdbRating ? ` · IMDb ${serial.imdbRating.toFixed(1)}` : ""}</p></div>
          <Link href={`/serial/${serial.slug}`} aria-label="Serial sahifasiga qaytish" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15"><ChevronLeft className="h-5 w-5" /></Link>
        </section>

        <div className="xl:hidden"><SeasonEpisodeSelector slug={serial.slug} episodes={playableEpisodes} activeSeason={currentEpisode.season} activeEpisode={currentEpisode.episode} compact fallbackImage={serial.backdropUrl || serial.posterUrl} /></div>
        <WatchComments ref={commentsRef} movie={serial} onReaction={setReaction} />
      </div>

      <aside className="hidden min-w-0 xl:sticky xl:top-20 xl:block xl:self-start" aria-label="Qismlar"><SeasonEpisodeSelector slug={serial.slug} episodes={playableEpisodes} activeSeason={currentEpisode.season} activeEpisode={currentEpisode.episode} compact sidebar fallbackImage={serial.backdropUrl || serial.posterUrl} /></aside>
    </main>
  </div>;
}
