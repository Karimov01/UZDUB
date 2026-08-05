import Image from "next/image";
import Link from "next/link";
import { Clock3, Play, Tv2 } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { LatestEpisode } from "@/lib/movies";

function relativeTime(value: string): string {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 2) return "Hozirgina";
  if (minutes < 60) return `${minutes} daqiqa avval`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat avval`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Kecha" : `${days} kun avval`;
}

export default function LatestEpisodeHomeCard({ item }: { item: LatestEpisode }) {
  const { serial, episode } = item;
  const href = `/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`;
  const image = episode.previewUrl || serial.backdropUrl || serial.posterUrl;

  return <Link href={href} className="group flex h-[92px] w-[86vw] max-w-[340px] shrink-0 gap-3 rounded-2xl p-2.5 transition-all duration-300 hover:-translate-y-0.5 sm:w-[310px] lg:w-[330px]" style={{ scrollSnapAlign: "start", background: "linear-gradient(135deg, rgba(22,18,35,.96), rgba(12,13,21,.94))", border: "1px solid rgba(167,139,250,.48)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.05), 0 8px 25px rgba(0,0,0,.2)" }}>
    <div className="relative h-full w-[126px] shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
      {image ? <Image src={optimizedTmdbImage(image, "backdrop")!} alt={`${serial.title} ${episode.episode}-qism`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 126px, 140px" /> : <div className="absolute inset-0 flex items-center justify-center"><Tv2 className="h-7 w-7 text-violet-300/60" /></div>}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/25" />
      <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", boxShadow: "0 4px 12px rgba(139,92,246,.4)" }}><Play className="h-2.5 w-2.5 fill-white" />{episode.episode}-qism</span>
    </div>
    <div className="min-w-0 flex flex-1 flex-col justify-center"><h3 className="line-clamp-2 text-sm font-bold leading-5 text-white transition-colors group-hover:text-violet-200">{serial.title}</h3><p className="mt-1 line-clamp-1 text-xs" style={{ color: "#c4b5fd" }}>{episode.title && episode.title !== `${episode.episode}-qism` ? episode.title : `${episode.season}-fasl · ${episode.episode}-qism`}</p><div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}><Clock3 className="h-3.5 w-3.5" />{relativeTime(item.addedAt)}</div></div>
  </Link>;
}
