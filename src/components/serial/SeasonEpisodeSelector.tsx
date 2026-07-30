"use client";

import Link from "next/link";
import { Play, Layers3, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Episode } from "@/types/movie";

type Props = { slug: string; episodes: Episode[]; activeSeason?: number; activeEpisode?: number; title?: string; compact?: boolean };

export function normalizeEpisodes(episodes: Episode[]): Episode[] {
  return [...episodes]
    .map((episode) => ({ ...episode, season: Number(episode.season) || 1, episode: Number(episode.episode) || 1 }))
    .sort((a, b) => a.season - b.season || a.episode - b.episode);
}

export default function SeasonEpisodeSelector({ slug, episodes, activeSeason, activeEpisode, title, compact = false }: Props) {
  const groups = useMemo(() => {
    const result = new Map<number, Episode[]>();
    for (const episode of normalizeEpisodes(episodes)) {
      const seasonEpisodes = result.get(episode.season) ?? [];
      seasonEpisodes.push(episode);
      result.set(episode.season, seasonEpisodes);
    }
    return [...result.entries()].map(([season, items]) => ({ season, episodes: items }));
  }, [episodes]);
  const initialSeason = activeSeason && groups.some((group) => group.season === activeSeason) ? activeSeason : groups[0]?.season;
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  useEffect(() => { if (activeSeason && groups.some((group) => group.season === activeSeason)) setSelectedSeason(activeSeason); }, [activeSeason, groups]);
  if (!groups.length || !selectedSeason) return null;
  const current = groups.find((group) => group.season === selectedSeason) ?? groups[0];

  return (
    <section className={compact ? "mt-5" : "max-w-[1120px] mx-auto px-4 md:px-8 py-8"} aria-label="Fasllar va qismlar">
      <div className="rounded-2xl md:rounded-3xl p-4 md:p-5 overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(22,18,34,0.92), rgba(10,11,19,0.94))", border: "1px solid rgba(167,139,250,0.26)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 42px rgba(0,0,0,0.22)" }}>
        <div className="flex items-center justify-between gap-3 mb-4"><h2 className="flex items-center gap-2 text-lg md:text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}><span className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ color: "#d8b4fe", background: "rgba(124,58,237,0.16)", border: "1px solid rgba(167,139,250,0.3)" }}><Layers3 className="h-4 w-4" /></span>Fasllar va qismlar</h2><span className="hidden sm:flex items-center gap-1.5 text-xs font-medium" style={{ color: "#c4b5fd" }}><Sparkles className="h-3.5 w-3.5" /> Qismni tanlang</span></div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Fasllar">
          {groups.map((group) => { const selected = group.season === selectedSeason; return <button key={group.season} type="button" role="tab" aria-selected={selected} onClick={() => setSelectedSeason(group.season)} className="shrink-0 min-w-[126px] px-3 py-2.5 rounded-xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 hover:-translate-y-0.5" style={{ background: selected ? "linear-gradient(135deg, rgba(124,58,237,0.48), rgba(76,29,149,0.3))" : "rgba(255,255,255,0.035)", border: selected ? "1px solid rgba(196,132,252,0.85)" : "1px solid rgba(255,255,255,0.1)", boxShadow: selected ? "0 0 20px rgba(139,92,246,0.28), inset 0 1px 0 rgba(255,255,255,0.12)" : "none" }}><span className="block text-sm font-semibold text-white">{group.season}-fasl</span><span className="block mt-0.5 text-xs" style={{ color: selected ? "#e9d5ff" : "var(--text-muted)" }}>{group.episodes.length} qism</span></button>; })}
        </div>
        <div className="mt-3 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {current.episodes.map((episode) => { const selected = episode.season === activeSeason && episode.episode === activeEpisode; return <Link key={episode.id} href={`/serial/${slug}/qism/${episode.season}/${episode.episode}`} aria-label={`${episode.season}-fasl ${episode.episode}-qism${episode.title ? `: ${episode.title}` : ""}`} className="relative min-w-0 rounded-xl p-3 transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" style={{ background: selected ? "linear-gradient(135deg, rgba(124,58,237,0.42), rgba(46,16,101,0.34))" : "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))", border: selected ? "1px solid rgba(192,132,252,0.9)" : "1px solid rgba(255,255,255,0.1)", boxShadow: selected ? "0 0 22px rgba(139,92,246,0.36), inset 0 1px 0 rgba(255,255,255,0.13)" : "none" }}><div className="flex items-center gap-2">{selected && <span className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #6d28d9)", boxShadow: "0 4px 12px rgba(139,92,246,0.45)" }}><Play className="h-3 w-3 fill-white text-white" /></span>}<span className="text-sm font-semibold text-white truncate">{episode.episode}-qism</span></div>{episode.duration ? <p className="mt-1.5 text-xs" style={{ color: selected ? "#e9d5ff" : "var(--text-muted)" }}>{episode.duration} daqiqa</p> : null}{selected && <span className="block h-0.5 mt-2 rounded-full" style={{ background: "linear-gradient(90deg, #ec4899, #a855f7, rgba(255,255,255,0.15))" }} />}</Link>; })}
        </div></div>
        {title && <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>{title} — {selectedSeason}-fasl, {current.episodes.length} qism</p>}
      </div>
    </section>
  );
}
