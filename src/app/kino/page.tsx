import type { Metadata } from "next";
import { getKinolar } from "@/lib/movies";
import MovieCard from "@/components/movie/MovieCard";
import { Film } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = { title: "Kinolar" };

export default async function KinolarPage() {
  const kinolar = await getKinolar();
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Film className="h-7 w-7" style={{ color: "var(--accent-violet)" }} />
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Barcha Kinolar
        </h1>
      </div>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        {kinolar.length} ta kino mavjud
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {kinolar.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
