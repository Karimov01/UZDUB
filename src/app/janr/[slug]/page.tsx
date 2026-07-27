import type { Metadata } from "next";
import { DEMO_MOVIES } from "@/lib/demo-data";
import MovieCard from "@/components/movie/MovieCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { title };
}

export default async function JanrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const movies = DEMO_MOVIES.filter((m) =>
    m.genres?.some((g) => g.slug === slug)
  );

  const allMovies = movies.length > 0 ? movies : DEMO_MOVIES;
  const title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <h1
        className="text-3xl font-bold text-white mb-2 capitalize"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        {allMovies.length} ta kino topildi
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {allMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
