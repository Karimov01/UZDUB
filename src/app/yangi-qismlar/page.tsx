import type { Metadata } from "next";
import { Clapperboard, Sparkles } from "lucide-react";
import HomeEpisodeCard from "@/components/home/HomeEpisodeCard";
import { getLatestEpisodes } from "@/lib/movies";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Yangi qismlar",
  description: "UZDUB Play platformasida eng so'nggi qo'shilgan serial qismlarini tomosha qiling.",
  alternates: { canonical: "/yangi-qismlar" },
};

export default async function LatestEpisodesPage() {
  const episodes = await getLatestEpisodes(120);

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 md:px-8" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 rounded-3xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, rgba(88,28,135,.28), rgba(15,23,42,.64))", border: "1px solid rgba(167,139,250,.28)" }}>
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "rgba(124,58,237,.22)", color: "#d8b4fe" }}><Sparkles className="h-5 w-5" /></span><div><h1 className="text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Yangi qismlar</h1><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Seriallarga eng so&apos;nggi qo&apos;shilgan, tomosha qilishga tayyor qismlar.</p></div></div>
        </div>
        {episodes.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">{episodes.map((item) => <HomeEpisodeCard key={item.episode.id} item={item} />)}</div> : <div className="rounded-3xl px-6 py-20 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><Clapperboard className="mx-auto h-12 w-12 text-violet-300" /><h2 className="mt-4 text-xl font-bold text-white">Hozircha yangi qism yo&apos;q</h2><p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Administrator serial qismiga video manzilini qo&apos;shgach, u shu yerda ko&apos;rinadi.</p></div>}
      </div>
    </main>
  );
}
