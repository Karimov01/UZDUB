import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { MovieCardData } from "@/types/movie";
import { cn } from "@/lib/utils";

export default function SeriesCard({ serial, layout = "carousel" }: { serial: MovieCardData; size?: "sm" | "md" | "lg"; layout?: "carousel" | "grid" }) {
  const image = optimizedTmdbImage(serial.backdropUrl, "backdrop") ?? optimizedTmdbImage(serial.posterUrl, "poster");
  const episodeLabel = serial.latestEpisode ? (serial.latestSeason && serial.latestSeason > 1 ? `${serial.latestSeason}-fasl • ${serial.latestEpisode}-qism` : `${serial.latestEpisode} qism`) : null;
  return <Link href={`/serial/${serial.slug}`} className={cn("group relative block aspect-[16/8.5] overflow-hidden rounded-xl border border-white/15 bg-[#111315] transition-colors hover:border-amber-400/45", layout === "grid" ? "w-full min-w-0" : "w-[calc(100vw-32px)] shrink-0 sm:w-[430px] lg:w-[calc((min(100vw,1400px)-96px)/3)]")} style={{ scrollSnapAlign: layout === "carousel" ? "start" : undefined }}>
    {image ? <Image src={image} alt={`${serial.title} seriali`} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 430px, 33vw" /> : <div className="absolute inset-0 flex items-center justify-center text-white/25"><ImageOff className="h-10 w-10" /></div>}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/10" />
    {serial.imdbRating ? <span className="absolute right-3 top-3 rounded bg-[#f5c518] px-1.5 py-1 text-[10px] font-black leading-none text-black">IMDb&nbsp; {serial.imdbRating.toFixed(1)}</span> : null}
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
      <h3 className="line-clamp-1 text-base font-semibold text-white md:text-lg">{serial.title}</h3>
      {episodeLabel ? <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black md:text-xs">{episodeLabel}</span> : null}
    </div>
  </Link>;
}
