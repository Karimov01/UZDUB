import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clapperboard, Tv } from "lucide-react";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryRow from "@/components/home/CategoryRow";
import TrendingSection from "@/components/home/TrendingSection";
import { HeroSkeleton, MovieCardSkeleton } from "@/components/ui/Skeleton";
import { getFeatured, getTrending, getSerials, getPublishedMovies } from "@/lib/movies";

export const revalidate = 60;
export const metadata: Metadata = { title: "O'zbek tilidagi kino va seriallar", description: "O'zbek tilidagi kino va seriallarni yuqori sifatda tomosha qiling." };

export default async function HomePage() {
  const [featured, trending, serials, allMovies] = await Promise.all([getFeatured(), getTrending(), getSerials(), getPublishedMovies()]);
  const mostViewed = [...allMovies].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  const newest = allMovies.slice(0, 12);
  return <div style={{ background: "var(--bg-primary)" }}>
    <Suspense fallback={<HeroSkeleton />}><HeroBanner movies={featured} /></Suspense>
    <div className="relative z-10 -mt-8">
      <Suspense fallback={<div className="px-8 grid grid-cols-5 gap-4 py-6">{Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}</div>}>
        <CategoryRow title={<><Clapperboard className="inline-block h-5 w-5 mr-2 text-violet-400" />Eng ko&apos;p ko&apos;rilgan</>} href="/kino" movies={mostViewed} />
      </Suspense>
      <TrendingSection movies={trending} />
      <CategoryRow title={<><Tv className="inline-block h-5 w-5 mr-2 text-pink-400" />Seriallar</>} href="/serial" movies={serials} />
      <CategoryRow title={<><CalendarDays className="inline-block h-5 w-5 mr-2 text-cyan-400" />Bugun qo&apos;shilganlar</>} href="/kino" movies={newest} />
      <section className="px-4 md:px-8 max-w-[1400px] mx-auto py-8"><div className="rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))", border: "1px solid rgba(124,58,237,0.3)" }}><div><h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>Barcha janrlar sizni kutmoqda</h2><p style={{ color: "var(--text-secondary)" }}>Drama, komediya, triller, fantastika va boshqa ko&apos;plab janrlar</p></div><Link href="/janr" className="px-8 py-3 rounded-xl font-semibold text-white shrink-0" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>Janrlarni ko&apos;rish →</Link></div></section>
      <div className="h-12" />
    </div>
  </div>;
}
