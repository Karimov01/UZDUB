import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { Movie } from "@/types/movie";

export default function WatchRecommendations({ movies }: { movies: Movie[] }) {
  if (!movies.length) return null;

  return (
    <aside className="rounded-2xl p-3 md:p-4" style={{ background: "linear-gradient(145deg, rgba(21,18,35,.88), rgba(9,10,18,.96))", border: "1px solid rgba(167,139,250,.22)", boxShadow: "0 18px 42px rgba(0,0,0,.2)" }} aria-label="Tavsiya etilgan kinolar">
      <h2 className="mb-3 px-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Tavsiya etilgan</h2>
      <div className="space-y-2.5">
        {movies.map((movie) => (
          <Link key={movie.id} href={`/kino/${movie.slug}/tomosha`} className="group flex min-h-[88px] gap-3 rounded-xl p-2 transition-colors hover:bg-white/[.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
            <div className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-black/30">
              {movie.posterUrl ? <Image src={movie.posterUrl} alt="" fill sizes="52px" className="object-cover" /> : <span className="flex h-full items-center justify-center"><Play className="h-4 w-4 text-violet-300" /></span>}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-white transition-colors group-hover:text-violet-200">{movie.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {movie.imdbRating ? <span className="inline-flex items-center gap-1 text-amber-300"><Star className="h-3 w-3 fill-current" />{movie.imdbRating.toFixed(1)}</span> : null}
                {movie.year ? <span>{movie.year}</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
