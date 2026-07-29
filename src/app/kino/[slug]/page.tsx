import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieBySlug, getPublishedMovies } from "@/lib/movies";
import KinoDetail from "@/components/movie/KinoDetail";
import JsonLd from "@/components/seo/JsonLd";
import { buildMovieMetadata, buildMovieJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Topilmadi" };
  return buildMovieMetadata(movie);
}

export default async function KinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();
  const allMovies = await getPublishedMovies();
  return (
    <>
      <JsonLd data={buildMovieJsonLd(movie)} />
      <KinoDetail movie={movie} similarMovies={allMovies} />
    </>
  );
}
