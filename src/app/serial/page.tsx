import type { Metadata } from "next";
import { DEMO_SERIALS } from "@/lib/demo-data";
import MovieCard from "@/components/movie/MovieCard";

export const metadata: Metadata = { title: "Seriallar" };

export default function SeriallarPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10" style={{ color: "var(--text-primary)" }}>
      <h1
        className="text-3xl font-bold text-white mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Barcha Seriallar
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        {DEMO_SERIALS.length} ta serial mavjud
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {DEMO_SERIALS.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
