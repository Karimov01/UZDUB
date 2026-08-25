import Image from "next/image";
import Link from "next/link";
import { Clock3, ImageOff } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { optimizedTmdbImage } from "@/lib/images";
import type { MovieCardData } from "@/types/movie";

export default function ComingSoonCard({ item }: { item: MovieCardData }) {
  const href = item.status === "PUBLISHED" ? `/${item.type === "SERIAL" ? "serial" : "kino"}/${item.slug}` : undefined;
  const content = <>
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/15 bg-[#111315]">
      {item.posterUrl ? <Image src={optimizedTmdbImage(item.posterUrl, "poster")!} alt={`${item.title} posteri`} fill className="object-contain transition-transform duration-500 group-hover:scale-[1.015]" sizes="(max-width: 640px) 46vw, 210px" /> : <div className="absolute inset-0 flex items-center justify-center text-white/25"><ImageOff className="h-9 w-9" /></div>}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent" />
      <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-[9px] font-extrabold leading-none text-black">Tez kunda</span>
      {item.isRussian ? <span className="absolute left-2 top-8 rounded-full bg-sky-600 px-2 py-1 text-[9px] font-bold leading-none text-white">Rus tilida</span> : null}
      {item.imdbRating ? <span className="absolute right-2 top-2 rounded bg-[#f5c518] px-1.5 py-1 text-[10px] font-black leading-none text-black">IMDb&nbsp; {item.imdbRating.toFixed(1)}</span> : null}
      {item.type === "MOVIE" && item.duration ? <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-1 text-[10px] text-white"><Clock3 className="h-3 w-3" />{formatDuration(item.duration)}</span> : null}
      {item.type === "SERIAL" && item.latestEpisode ? <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-1 text-[10px] text-white">{item.latestEpisode} qism</span> : null}
    </div>
    <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-white">{item.title}</h3>
    <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>{item.type === "SERIAL" ? "Serial" : "Kino"} • {item.genres?.[0]?.name ?? "Premyera"}{item.year ? ` • ${item.year}` : ""}</p>
  </>;
  const classes = "group block w-[calc((100vw-44px)/2)] max-w-[184px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 lg:w-[calc((min(100vw,1400px)-144px)/6)] lg:max-w-none";
  return href ? <Link href={href} className={classes} style={{ scrollSnapAlign: "start" }}>{content}</Link> : <article className={classes} style={{ scrollSnapAlign: "start" }}>{content}</article>;
}
