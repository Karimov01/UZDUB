import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { getAllMovies } from "@/lib/movies";

export const metadata: Metadata = { title: "Janrlar" };

const COLORS = ["#7C3AED", "#EC4899", "#06B6D4", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F97316"];

export default async function JanrlarAdminPage() {
  const movies = await getAllMovies();
  const map = new Map<string, { name: string; slug: string; count: number }>();
  movies.forEach((movie) => movie.genres?.forEach((genre) => {
    const current = map.get(genre.slug);
    map.set(genre.slug, { name: genre.name, slug: genre.slug, count: (current?.count ?? 0) + 1 });
  }));
  const genres = [...map.values()].sort((a, b) => b.count - a.count);

  return <div>
    <div className="mb-6"><h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Janrlar</h1><p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{genres.length} ta janr — Neon bazasidagi kontentdan hisoblangan</p></div>
    {genres.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{genres.map((genre, index) => {
      const color = COLORS[index % COLORS.length];
      return <div key={genre.slug} className="p-4 rounded-2xl" style={{ background: `${color}12`, border: `1px solid ${color}33` }}><div className="p-2 rounded-lg w-fit mb-3" style={{ background: `${color}25` }}><Tag className="h-4 w-4" style={{ color }} /></div><h3 className="font-semibold text-white mb-1">{genre.name}</h3><p className="text-xs" style={{ color: "var(--text-muted)" }}>{genre.count} ta kontent</p><p className="text-xs mt-1" style={{ color }}>/{genre.slug}</p></div>;
    })}</div> : <div className="p-8 rounded-2xl text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Hali kontent qo&apos;shilmagan. Kino yoki serial saqlangach janrlar shu yerda avtomatik ko&apos;rinadi.</div>}
  </div>;
}
