"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownUp, Clapperboard, Layers3, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Episode } from "@/types/movie";

const INITIAL_VISIBLE_EPISODES = 20;

type Props = {
  slug: string;
  episodes: Episode[];
  activeSeason?: number;
  activeEpisode?: number;
  title?: string;
  compact?: boolean;
  sidebar?: boolean;
  fallbackImage?: string;
};

export function normalizeEpisodes(episodes: Episode[]): Episode[] {
  return [...episodes]
    .map((episode) => ({
      ...episode,
      season: Number(episode.season) || 1,
      episode: Number(episode.episode) || 1,
    }))
    .sort((a, b) => a.season - b.season || a.episode - b.episode);
}

function EpisodeThumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-[66px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet-950 via-slate-950 to-black">
      {src && !failed ? (
        <Image src={src} alt="" fill sizes="104px" className="object-cover object-center" onError={() => setFailed(true)} />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/35" />
      <span className="absolute inset-0 flex items-center justify-center">
        <Play className="h-5 w-5 text-violet-200 drop-shadow-[0_1px_4px_rgba(0,0,0,.9)]" />
      </span>
    </div>
  );
}

export default function SeasonEpisodeSelector({
  slug,
  episodes,
  activeSeason,
  activeEpisode,
  compact = false,
  sidebar = false,
  fallbackImage,
}: Props) {
  const groups = useMemo(() => {
    const map = new Map<number, Episode[]>();
    for (const episode of normalizeEpisodes(episodes)) {
      map.set(episode.season, [...(map.get(episode.season) ?? []), episode]);
    }
    return [...map.entries()].map(([season, items]) => ({ season, episodes: items }));
  }, [episodes]);
  const [selectedSeason, setSelectedSeason] = useState(
    activeSeason && groups.some((group) => group.season === activeSeason) ? activeSeason : groups[0]?.season,
  );
  const [descending, setDescending] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState((activeEpisode ?? 0) > INITIAL_VISIBLE_EPISODES);

  useEffect(() => {
    if (activeSeason && groups.some((group) => group.season === activeSeason)) {
      setSelectedSeason(activeSeason);
    }
  }, [activeSeason, groups]);

  if (!groups.length || !selectedSeason) return null;

  const current = groups.find((group) => group.season === selectedSeason) ?? groups[0];
  const orderedEpisodes = descending ? [...current.episodes].reverse() : current.episodes;
  const visibleEpisodes = showAllEpisodes ? orderedEpisodes : orderedEpisodes.slice(0, INITIAL_VISIBLE_EPISODES);
  const episodeToggle = current.episodes.length > INITIAL_VISIBLE_EPISODES ? (
    <button type="button" onClick={() => setShowAllEpisodes((value) => !value)} className="mt-4 w-full rounded-xl border border-white/15 bg-white/[.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-fuchsia-400/50 hover:bg-white/[.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400">
      {showAllEpisodes ? "Kamroq ko‘rsatish" : `Yana ko‘rsatish (${current.episodes.length - INITIAL_VISIBLE_EPISODES})`}
    </button>
  ) : null;
  const seasons = (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {groups.map((group) => {
        const active = group.season === selectedSeason;
        return (
          <button
            key={group.season}
            type="button"
            onClick={() => { setSelectedSeason(group.season); setShowAllEpisodes(Boolean(activeSeason === group.season && (activeEpisode ?? 0) > INITIAL_VISIBLE_EPISODES)); }}
            className="shrink-0 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            style={{
              background: active ? "rgba(124,58,237,.38)" : "rgba(255,255,255,.04)",
              border: active ? "1px solid rgba(216,180,254,.8)" : "1px solid rgba(255,255,255,.1)",
              color: "white",
            }}
          >
            <b>{group.season}-fasl</b>
            {!sidebar && <span className="ml-2 text-xs text-violet-200">{group.episodes.length} qism</span>}
          </button>
        );
      })}
    </div>
  );

  if (sidebar) {
    return (
      <section
        className="rounded-2xl p-3 md:p-4"
        style={{
          background: "linear-gradient(145deg,rgba(22,18,34,.96),rgba(10,11,19,.98))",
          border: "1px solid rgba(167,139,250,.28)",
          boxShadow: "0 16px 42px rgba(0,0,0,.24)",
        }}
        aria-label="Fasllar va qismlar"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Layers3 className="h-5 w-5 text-violet-300" />Fasllar va qismlar</h2>
          <span className="text-xs text-violet-200">{current.episodes.length} qism</span>
        </div>
        {seasons}
        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(167,139,250,.6)_transparent]">
          {visibleEpisodes.map((episode) => {
            const selected = episode.season === activeSeason && episode.episode === activeEpisode;
            return (
              <Link
                key={episode.id}
                href={`/serial/${slug}/qism/${episode.season}/${episode.episode}`}
                aria-current={selected ? "page" : undefined}
                className="flex min-h-[84px] gap-2.5 rounded-xl p-2 transition-all hover:bg-white/[.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                style={{
                  background: selected ? "linear-gradient(135deg,rgba(124,58,237,.34),rgba(46,16,101,.24))" : "rgba(255,255,255,.025)",
                  border: selected ? "1px solid rgba(192,132,252,.92)" : "1px solid rgba(255,255,255,.09)",
                  boxShadow: selected ? "0 0 18px rgba(139,92,246,.36)" : "none",
                }}
              >
                <EpisodeThumbnail src={episode.previewUrl || fallbackImage} />
                <div className="min-w-0 flex-1 self-center">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    {selected && <Play className="h-3.5 w-3.5 shrink-0 fill-violet-300 text-violet-300" />}
                    {episode.episode}-qism
                  </p>
                  {episode.duration ? <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{episode.duration} daqiqa</p> : null}
                </div>
              </Link>
            );
          })}
        </div>
        {episodeToggle}
      </section>
    );
  }

  return (
    <section className={compact ? "mt-5" : "mx-auto max-w-[1400px] px-4 py-8 md:px-8"} aria-label="Fasllar va qismlar">
      <div className="overflow-hidden rounded-2xl border border-white/[.04] bg-[#151817] p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Clapperboard className="h-4 w-4 fill-white text-white" />
            Qismlar
            <span className="rounded-lg border border-white/20 bg-white/[.08] px-2 py-0.5 text-xs font-semibold text-white">{episodes.length}</span>
          </h2>
          <button
            type="button"
            onClick={() => setDescending((value) => !value)}
            aria-label={descending ? "Qismlarni o'sish tartibida saralash" : "Qismlarni kamayish tartibida saralash"}
            title={descending ? "1 dan boshlab saralash" : "Oxirgi qismdan saralash"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-transparent text-white transition-colors hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((group) => {
            const active = group.season === selectedSeason;
            return (
              <button
                key={group.season}
                type="button"
                onClick={() => { setSelectedSeason(group.season); setShowAllEpisodes(Boolean(activeSeason === group.season && (activeEpisode ?? 0) > INITIAL_VISIBLE_EPISODES)); }}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${active ? "border-white/45 bg-white/[.06] text-white" : "border-white/15 bg-transparent text-violet-200 hover:bg-white/[.04]"}`}
              >
                {group.season}-fasl
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {visibleEpisodes.map((episode) => {
            const selected = episode.season === activeSeason && episode.episode === activeEpisode;
            return (
              <Link
                key={episode.id}
                href={`/serial/${slug}/qism/${episode.season}/${episode.episode}`}
                aria-current={selected ? "page" : undefined}
                aria-label={`${episode.episode}-qismni tomosha qilish`}
                className={`flex min-h-[52px] min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-sm transition-colors active:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${selected ? "border-fuchsia-400/70 bg-fuchsia-500/10 text-white" : "border-white/10 bg-transparent text-violet-200 hover:border-white/20 hover:bg-white/[.035]"}`}
              >
                <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-white/[.07] px-1.5 font-bold text-white">{episode.episode}</span>
                <span aria-hidden="true">•</span>
                <span>qism</span>
              </Link>
            );
          })}
        </div>
        {episodeToggle}
      </div>
    </section>
  );
}
