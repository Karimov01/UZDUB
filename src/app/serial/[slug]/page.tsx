import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedMovies, getSerialBySlug } from "@/lib/movies";
import { getRecommendations } from "@/lib/recommendations";
import SerialDetail from "@/components/movie/SerialDetail";
import JsonLd from "@/components/seo/JsonLd";
import { buildMovieMetadata, buildMovieJsonLd } from "@/lib/seo";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const serial = await getSerialBySlug(slug);
  if (!serial) return { title: "Topilmadi" };
  return buildMovieMetadata(serial);
}

export default async function SerialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const serial = await getSerialBySlug(slug);
  if (!serial) notFound();
  const allMovies = await getPublishedMovies();
  return (
    <>
      <JsonLd data={buildMovieJsonLd(serial)} />
      <SerialDetail serial={serial} similarMovies={getRecommendations(serial, allMovies).map((item) => item.movie)} />
    </>
  );
}
