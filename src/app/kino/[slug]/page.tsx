import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_MOVIES } from "@/lib/demo-data";
import KinoDetail from "@/components/movie/KinoDetail";
import JsonLd from "@/components/seo/JsonLd";
import { buildMovieMetadata, buildMovieJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const movie = DEMO_MOVIES.find((m) => m.slug === slug);
  if (!movie) return { title: "Topilmadi" };
  return buildMovieMetadata(movie);
}

export default async function KinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = DEMO_MOVIES.find((m) => m.slug === slug);
  if (!movie) notFound();
  return (
    <>
      <JsonLd data={buildMovieJsonLd(movie)} />
      <KinoDetail movie={movie} />
    </>
  );
}
