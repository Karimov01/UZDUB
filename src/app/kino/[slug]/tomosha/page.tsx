import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllMovies, getMovieBySlug } from "@/lib/movies";
import { getRecommendations } from "@/lib/recommendations";
import TomashaClient from "@/components/player/TomashaClient";
import JsonLd from "@/components/seo/JsonLd";
import { buildWatchJsonLd, buildWatchMetadata } from "@/lib/seo";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Kino topilmadi", robots: { index: false, follow: false } };
  return buildWatchMetadata(movie);
}

export default async function TomashaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();
  const schema = buildWatchJsonLd(movie);
  const recommendations = getRecommendations(movie, await getAllMovies())
    .map((item) => item.movie)
    .filter((item) => item.id !== movie.id && item.type === "MOVIE" && Boolean(item.videoUrl?.trim()))
    .slice(0, 6);
  return <>{schema && <JsonLd data={schema} />}<TomashaClient movie={movie} recommendations={recommendations} /></>;
}
