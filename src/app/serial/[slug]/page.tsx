import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSerialBySlug } from "@/lib/movies";
import SerialDetail from "@/components/movie/SerialDetail";
import JsonLd from "@/components/seo/JsonLd";
import { buildMovieMetadata, buildMovieJsonLd } from "@/lib/seo";

export const revalidate = 60;

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
  return (
    <>
      <JsonLd data={buildMovieJsonLd(serial)} />
      <SerialDetail serial={serial} />
    </>
  );
}
