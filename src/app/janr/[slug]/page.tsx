import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedMovies } from "@/lib/movies";
import MovieCard from "@/components/movie/MovieCard";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { title, alternates: { canonical: `/janr/${slug}` } };
}

export default async function JanrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const published = await getPublishedMovies();
  const movies = published.filter((m) => m.genres?.some((g) => g.slug === slug));

  if (movies.length === 0) notFound();

  const title = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <h1 className="text-3xl font-bold text-white mb-2 capitalize" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        {movies.length} ta kino topildi
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </div>
  );
}
