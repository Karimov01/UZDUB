import Image from "next/image";
import Link from "next/link";
import { Tv2 } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { LatestEpisode } from "@/lib/movies";

function relativeTime(value: string): string {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Hozirgina";
  if (hours < 24) return "Bugun yangilandi";
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kecha yangilandi";
  if (days < 7) return `${days} kun avval`;
  const weeks = Math.floor(days / 7);
  return `${weeks} hafta avval`;
}

export default function LatestEpisodeHomeCard({ item }: { item: LatestEpisode }) {
  const { serial, episode } = item;
  const image = episode.previewUrl || serial.backdropUrl || serial.posterUrl;
  return <Link href={`/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`} className="group flex min-w-0 items-center gap-2 rounded-lg border border-white/15 bg-white/[.035] p-1.5 transition-colors hover:border-amber-400/40">
    <div className="relative h-14 w-[42%] shrink-0 overflow-hidden rounded-md bg-white/5">{image ? <Image src={optimizedTmdbImage(image, "backdrop")!} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 640px) 22vw, 140px" /> : <div className="flex h-full items-center justify-center"><Tv2 className="h-5 w-5 text-gray-500" /></div>}</div>
    <div className="min-w-0"><h3 className="truncate text-[11px] font-semibold text-white md:text-xs">{serial.title}</h3><p className="mt-0.5 truncate text-[10px] text-gray-400">{episode.season}-fasl • {episode.episode}-qism</p><p className="mt-0.5 truncate text-[9px] text-gray-500 md:text-[10px]">{relativeTime(item.addedAt)}</p></div>
  </Link>;
}
