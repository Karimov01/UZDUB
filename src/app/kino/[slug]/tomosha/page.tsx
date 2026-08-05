import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieBySlug } from "@/lib/movies";
import TomashaClient from "@/components/player/TomashaClient";
import JsonLd from "@/components/seo/JsonLd";
import { buildWatchJsonLd, buildWatchMetadata } from "@/lib/seo";

export const revalidate = 60;

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
  return <>{schema && <JsonLd data={schema} />}<TomashaClient movie={movie} /></>;
}
