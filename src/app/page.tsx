import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryRow from "@/components/home/CategoryRow";
import TrendingSection from "@/components/home/TrendingSection";
import { HeroSkeleton, MovieCardSkeleton } from "@/components/ui/Skeleton";
import {
  DEMO_FEATURED,
  DEMO_TRENDING,
  DEMO_SERIALS,
  DEMO_KINOLAR,
  DEMO_MOVIES,
} from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "UZDUB Play — O'zbekistonning Premium Kino Platformasi",
  description:
    "O'zbekistonning eng yaxshi kino va serial platformasi. HD sifatda, o'zbek tilida tomosha qiling.",
};

export default function HomePage() {
  return (
    <div style={{ background: "var(--bg-primary)" }}>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroBanner movies={DEMO_FEATURED} />
      </Suspense>

      <div className="relative z-10 -mt-8">
        <Suspense
          fallback={
            <div className="px-8 grid grid-cols-5 gap-4 py-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <CategoryRow
            title="🎬 Eng Ko'p Ko'rilgan"
            href="/kino"
            movies={DEMO_KINOLAR}
          />
        </Suspense>

        <TrendingSection movies={DEMO_TRENDING} />

        <CategoryRow
          title="📺 Seriallar"
          href="/serial"
          movies={DEMO_SERIALS}
        />

        <CategoryRow
          title="⭐ Tanlangan Kinolar"
          href="/kino"
          movies={DEMO_MOVIES}
        />

        <section className="px-4 md:px-8 max-w-[1400px] mx-auto py-8">
          <div
            className="rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.15) 100%)",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Barcha janrlar sizni kutmoqda
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                Drama, komediya, triller, fantastika va boshqa ko&#39;plab janrlar
              </p>
            </div>
            <Link
              href="/janr"
              className="px-8 py-3 rounded-xl font-semibold text-white shrink-0 transition-all hover:opacity-90 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
            >
              Janrlarni ko&#39;rish →
            </Link>
          </div>
        </section>

        <div className="h-12" />
      </div>
    </div>
  );
}
