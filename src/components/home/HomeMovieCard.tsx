import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Play, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDuration, formatViewCount } from "@/lib/utils";
import type { MovieCardData } from "@/types/movie";

export default function HomeMovieCard({ movie, size = "md" }: { movie: MovieCardData; size?: "sm" | "md" | "lg" }) {
  const href = movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`;
  return (
    <Link href={href} className="group relative block shrink-0" style={{ width: size === "lg" ? "200px" : size === "sm" ? "130px" : "160px", scrollSnapAlign: "start" }}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
        {movie.posterUrl ? (
          <Image src={movie.posterUrl} alt={`${movie.title} posteri`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 130px, 160px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Play className="h-10 w-10 text-gray-600" /></div>
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }}>
          <span className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}><Play className="h-5 w-5 ml-0.5 text-white fill-white" /></span>
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {movie.isTrending && <Badge variant="pink" size="sm">Trend</Badge>}
          {movie.isPremium && <Badge variant="yellow" size="sm">Premium</Badge>}
        </div>
        {movie.imdbRating ? <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "#F5C518", color: "#000" }}><Star className="h-3 w-3 fill-black" />{movie.imdbRating.toFixed(1)}</div> : null}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className={`font-semibold line-clamp-1 text-white group-hover:text-purple-300 transition-colors ${size === "sm" ? "text-xs" : "text-sm"}`}>{movie.title}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap" style={{ color: "var(--text-muted)" }}>
          {movie.year ? <span className="text-xs">{movie.year}</span> : null}
          {movie.duration ? <span className="text-xs flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatDuration(movie.duration)}</span> : null}
          {movie.viewCount !== undefined ? <span className="text-xs flex items-center gap-0.5"><Eye className="h-3 w-3" />{formatViewCount(movie.viewCount)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
