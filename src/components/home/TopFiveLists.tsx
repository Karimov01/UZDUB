import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clapperboard, Tv } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { MovieCardData } from "@/types/movie";

function TopList({ title, items, type }: { title: string; items: MovieCardData[]; type: "MOVIE" | "SERIAL" }) {
  if (!items.length) return null;
  return <section className="overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-white/[.055] to-white/[.025]">
    <h2 className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-base font-bold text-white">{type === "MOVIE" ? <Clapperboard className="h-5 w-5" /> : <Tv className="h-5 w-5" />}{title}</h2>
    <ol className="px-3 py-1.5">{items.map((item, index) => <li key={item.id} className="border-b border-white/[.07] last:border-0">
      <Link href={`/${type === "SERIAL" ? "serial" : "kino"}/${item.slug}`} className="group flex min-h-14 items-center gap-3 py-1.5">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white ${index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-500" : index === 2 ? "bg-orange-600" : "bg-white/15"}`}>{index + 1}</span>
        <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-white/5">{item.posterUrl ? <Image src={optimizedTmdbImage(item.posterUrl, "poster")!} alt="" fill className="object-cover" sizes="32px" /> : null}</div>
        <div className="min-w-0 flex-1"><h3 className="truncate text-xs font-medium text-white md:text-sm">{item.title}</h3><div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">{item.imdbRating ? <span><b className="rounded-sm bg-[#f5c518] px-1 font-black text-black">IMDb</b> {item.imdbRating.toFixed(1)}</span> : null}{item.year ? <span>{item.year}</span> : null}</div></div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
      </Link>
    </li>)}</ol>
  </section>;
}

export default function TopFiveLists({ movies, serials }: { movies: MovieCardData[]; serials: MovieCardData[] }) {
  if (!movies.length && !serials.length) return null;
  return <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 px-4 py-5 md:px-8 lg:grid-cols-2"><TopList title="TOP 5 Kinolar" items={movies} type="MOVIE" /><TopList title="TOP 5 Seriallar" items={serials} type="SERIAL" /></div>;
}
