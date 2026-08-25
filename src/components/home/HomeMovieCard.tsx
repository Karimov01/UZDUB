import Image from "next/image";
import Link from "next/link";
import { Clock3, ImageOff } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { optimizedTmdbImage } from "@/lib/images";
import type { MovieCardData } from "@/types/movie";
import NewBadge from "@/components/home/NewBadge";

export default function HomeMovieCard({ movie, layout = "carousel" }: { movie: MovieCardData; size?: "sm" | "md" | "lg"; layout?: "carousel" | "grid" }) {
  const genre = movie.genres?.[0]?.name;
  return (
    <Link href={`/kino/${movie.slug}`} aria-label={`${movie.title} haqida batafsil`} className={cn("group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400", layout === "grid" ? "w-full min-w-0" : "w-[calc((100vw-44px)/2)] max-w-[184px] shrink-0 lg:w-[calc((min(100vw,1400px)-144px)/6)] lg:max-w-none")} style={{ scrollSnapAlign: layout === "carousel" ? "start" : undefined }}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/15 bg-[#111315] transition-colors group-hover:border-amber-400/55">
        {movie.posterUrl ? <Image src={optimizedTmdbImage(movie.posterUrl, "poster")!} alt={`${movie.title} posteri`} fill className="object-contain transition-transform duration-500 group-hover:scale-[1.015]" sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, 210px" /> : <div className="absolute inset-0 flex items-center justify-center text-white/25"><ImageOff className="h-9 w-9" /></div>}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent" />
        <NewBadge publishedAt={movie.publishedAt} />
        {movie.imdbRating ? <span className="absolute right-2 top-2 rounded bg-[#f5c518] px-1.5 py-1 text-[10px] font-black leading-none text-black">IMDb&nbsp; {movie.imdbRating.toFixed(1)}</span> : null}
        {movie.duration ? <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm"><Clock3 className="h-3 w-3" />{formatDuration(movie.duration)}</span> : null}
      </div>
      <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-white transition-colors group-hover:text-amber-300 md:text-[15px]">{movie.title}</h3>
      <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>{genre ?? "Kino"}{movie.year ? ` • ${movie.year}` : ""}</p>
    </Link>
  );
}
