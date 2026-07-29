import type { Metadata } from "next";
import { Eye, Film, Star, TrendingUp } from "lucide-react";
import { getAllMovies } from "@/lib/movies";
import { formatViewCount } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistika" };

export default async function StatistikaPage() {
  const allMovies = await getAllMovies();
  const totalViews = allMovies.reduce((sum, movie) => sum + (movie.viewCount ?? 0), 0);
  const movies = allMovies.filter((movie) => movie.type !== "SERIAL");
  const serials = allMovies.filter((movie) => movie.type === "SERIAL");
  const topByViews = [...allMovies].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 10);
  const topByRating = [...allMovies].filter((movie) => movie.imdbRating !== undefined).sort((a, b) => (b.imdbRating ?? 0) - (a.imdbRating ?? 0)).slice(0, 10);
  const genreMap = new Map<string, number>();
  allMovies.forEach((movie) => movie.genres?.forEach((genre) => genreMap.set(genre.name, (genreMap.get(genre.name) ?? 0) + 1)));
  const genres = [...genreMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxViews = Math.max(1, ...topByViews.map((movie) => movie.viewCount ?? 0));
  const maxGenre = Math.max(1, ...genres.map(([, count]) => count));

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Statistika</h1><p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Neon bazasidagi haqiqiy kontent ma&apos;lumotlari</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Jami kontent", value: allMovies.length, icon: Film, color: "#7C3AED" },
          { label: "Jami ko'rishlar", value: formatViewCount(totalViews), icon: Eye, color: "#06B6D4" },
          { label: "Kinolar / Seriallar", value: `${movies.length} / ${serials.length}`, icon: TrendingUp, color: "#EC4899" },
          { label: "Reytingli materiallar", value: topByRating.length, icon: Star, color: "#F59E0B" },
        ].map((item) => <div key={item.label} className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><item.icon className="h-5 w-5 mb-3" style={{ color: item.color }} /><p className="text-2xl font-bold text-white">{item.value}</p><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.label}</p></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Ranking title="Top ko'rishlar" items={topByViews.map((movie) => ({ id: movie.id, name: movie.title, value: formatViewCount(movie.viewCount ?? 0), percent: ((movie.viewCount ?? 0) / maxViews) * 100 }))} />
        <Ranking title="Top reyting" items={topByRating.map((movie) => ({ id: movie.id, name: movie.title, value: `${movie.imdbRating ?? 0} / 10`, percent: ((movie.imdbRating ?? 0) / 10) * 100 }))} color="#F59E0B" />
      </div>
      <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><h2 className="font-semibold text-white mb-5">Janrlar taqsimoti</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{genres.length ? genres.map(([name, count]) => <div key={name} className="p-3 rounded-xl text-center" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}><div className="h-2 rounded-full mb-2" style={{ width: `${(count / maxGenre) * 100}%`, background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} /><p className="font-bold text-white">{count}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{name}</p></div>) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bazaga kontent qo'shilgach janr statistikasi paydo bo'ladi.</p>}</div></div>
    </div>
  );
}

function Ranking({ title, items, color = "#7C3AED" }: { title: string; items: { id: string; name: string; value: string; percent: number }[]; color?: string }) {
  return <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><h2 className="font-semibold text-white mb-4">{title}</h2>{items.length ? <div className="space-y-3">{items.map((item, index) => <div key={item.id}><div className="flex justify-between gap-3 text-sm mb-1"><span className="text-white truncate">{index + 1}. {item.name}</span><span style={{ color: "var(--text-muted)" }}>{item.value}</span></div><div className="h-1.5 rounded-full" style={{ background: "var(--bg-primary)" }}><div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: color }} /></div></div>)}</div> : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ma&apos;lumot hali yo&apos;q.</p>}</div>;
}
