import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Movie } from "@/types/movie";

export default function WatchRecommendations({ movies }: { movies: Movie[] }) {
  if (!movies.length) return null;
  return <section className="mt-2" aria-label="O'xshash kinolar">
    <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">O&apos;xshash kinolar</h2><Link href="/kinolar" className="flex items-center text-sm text-fuchsia-300">Barchasi <ChevronRight className="h-5 w-5" /></Link></div>
    <div className="watch-recommendations flex snap-x gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-6 md:overflow-visible">
      {movies.slice(0, 6).map((movie) => <Link key={movie.id} href={`/kino/${movie.slug}`} className="group w-[44vw] max-w-[190px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-white/[.035] md:w-auto md:max-w-none"><div className="relative aspect-[2/3] overflow-hidden bg-white/[.03]">{movie.posterUrl && <Image src={movie.posterUrl} alt={`${movie.title} posteri`} fill sizes="(max-width: 768px) 44vw, 190px" className="object-cover transition duration-300 group-hover:scale-[1.03]" />} {movie.imdbRating ? <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-1 text-xs font-bold text-amber-300">★ {movie.imdbRating.toFixed(1)}</span> : null}</div><div className="p-3"><p className="truncate text-sm font-semibold">{movie.title}</p><p className="mt-1 text-xs text-slate-500">{movie.year}</p></div></Link>)}
    </div>
  </section>;
}
