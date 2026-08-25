import { Suspense } from "react";
import type { Metadata } from "next";
import { CalendarDays, Clock3, Sparkles, Tv } from "lucide-react";
import HeroBanner from "@/components/home/HeroBanner";
import HomeGenreRow from "@/components/home/HomeGenreRow";
import CategoryRow from "@/components/home/CategoryRow";
import ComingSoonCard from "@/components/home/ComingSoonCard";
import HorizontalScroller from "@/components/home/HorizontalScroller";
import LatestEpisodeHomeCard from "@/components/home/LatestEpisodeHomeCard";
import SectionHeader from "@/components/home/SectionHeader";
import SeriesCard from "@/components/home/SeriesCard";
import TopFiveLists from "@/components/home/TopFiveLists";
import { HeroSkeleton, MovieCardSkeleton } from "@/components/ui/Skeleton";
import { getHomePageData } from "@/lib/movies";

export const revalidate = 600;
export const metadata: Metadata = { title: "O'zbek tilidagi kino va seriallar", description: "O'zbek tilidagi kino va seriallarni yuqori sifatda tomosha qiling." };

export default async function HomePage() {
  const { featured, serials, newest, topMovies, topSerials, comingSoon, latestEpisodes } = await getHomePageData();
  return <div style={{ background: "var(--bg-primary)" }}>
    <Suspense fallback={<HeroSkeleton />}><HeroBanner movies={featured} /></Suspense>
    <HomeGenreRow />
    <main className="relative z-10 pb-12">
      <Suspense fallback={<div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-3 px-3 py-6 sm:px-4 md:grid-cols-6 md:px-8">{Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)}</div>}>
        <CategoryRow title={<><Sparkles className="inline-block h-5 w-5 mr-2 text-amber-400" />Yangi tarjima kinolar</>} href="/kino" movies={newest} />
      </Suspense>

      {serials.length ? <section className="py-5"><SectionHeader title="Seriallar" href="/serial" icon={<Tv className="h-5 w-5 text-amber-400" />} /><HorizontalScroller>{serials.map((serial) => <SeriesCard key={serial.id} serial={serial} />)}</HorizontalScroller></section> : null}

      <TopFiveLists movies={topMovies} serials={topSerials} />

      {latestEpisodes.length ? <section className="py-5"><SectionHeader title="Yangi qismlar" href="/yangi-qismlar" icon={<CalendarDays className="h-5 w-5 text-amber-400" />} /><div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-2 px-3 sm:px-4 md:grid-cols-3 md:px-8 xl:grid-cols-4">{latestEpisodes.map((item) => <LatestEpisodeHomeCard key={item.episode.id} item={item} />)}</div></section> : null}

      {comingSoon.length ? <section className="py-5"><SectionHeader title="Tez kunda" href="/tez-kunda" icon={<Clock3 className="h-5 w-5 text-amber-400" />} /><HorizontalScroller>{comingSoon.map((item) => <ComingSoonCard key={item.id} item={item} />)}</HorizontalScroller></section> : null}
    </main>
  </div>;
}
