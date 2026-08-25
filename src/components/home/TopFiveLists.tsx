import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clapperboard, Tv } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { MovieCardData } from "@/types/movie";

function TopList({ title, items, type }: { title: string; items: MovieCardData[]; type: "MOVIE" | "SERIAL" }) {
  if (!items.length) return null;
  return <section className="overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-white/[.055] to-white/[.025]">
    <h2 className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5 text-base font-bold text-white md:px-5 md:py-4 md:text-lg">{type === "MOVIE" ? <Clapperboard className="h-5 w-5 md:h-6 md:w-6" /> : <Tv className="h-5 w-5 md:h-6 md:w-6" />}{title}</h2>
    <ol className="px-3 py-2 md:px-4">{items.map((item, index) => <li key={item.id} className="border-b border-white/[.07] last:border-0">
      <Link href={`/${type === "SERIAL" ? "serial" : "kino"}/${item.slug}`} className="group flex min-h-[76px] items-center gap-3 py-2 md:min-h-[84px] md:gap-4 md:py-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white shadow-sm md:h-10 md:w-10 md:text-base ${index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-500" : index === 2 ? "bg-orange-600" : "bg-white/15"}`}>{index + 1}</span>
        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/5 md:h-[72px] md:w-12">{item.posterUrl ? <Image src={optimizedTmdbImage(item.posterUrl, "poster")!} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="48px" /> : null}</div>
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-white md:text-base">{item.title}</h3><div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-gray-300 md:text-xs">{item.imdbRating ? <span className="inline-flex items-center gap-1.5"><b className="rounded bg-[#f5c518] px-1.5 py-0.5 text-[9px] font-black leading-none text-black md:text-[10px]">IMDb</b><strong className="font-semibold text-gray-200">{item.imdbRating.toFixed(1)}</strong></span> : null}{item.year ? <span>{item.year}</span> : null}</div></div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
      </Link>
    </li>)}</ol>
  </section>;
}

export default function TopFiveLists({ movies, serials }: { movies: MovieCardData[]; serials: MovieCardData[] }) {
  if (!movies.length && !serials.length) return null;
  return <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-3 py-5 sm:px-4 md:px-8 lg:grid-cols-2"><TopList title="TOP 5 Kinolar" items={movies} type="MOVIE" /><TopList title="TOP 5 Seriallar" items={serials} type="SERIAL" /></div>;
}
