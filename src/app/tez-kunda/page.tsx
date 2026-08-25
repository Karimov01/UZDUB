import type { Metadata } from "next";
import ComingSoonCard from "@/components/home/ComingSoonCard";
import { getComingSoon } from "@/lib/movies";

export const metadata: Metadata = { title: "Tez kunda", description: "UZDUB Play'da tez orada chiqadigan kino va seriallar." };

export default async function ComingSoonPage() {
  const items = await getComingSoon();
  return <main className="mx-auto min-h-[60vh] max-w-[1400px] px-4 py-10 md:px-8"><h1 className="text-2xl font-bold text-white md:text-3xl">Tez kunda</h1><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Yaqinda platformaga qo&apos;shiladigan kino va seriallar.</p>{items.length ? <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">{items.map((item) => <ComingSoonCard key={item.id} item={{ ...item, genres: item.genres }} />)}</div> : <div className="mt-12 rounded-xl border border-white/10 bg-white/[.03] p-8 text-center text-gray-400">Hozircha tez kunda chiqadigan material yo&apos;q.</div>}</main>;
}
