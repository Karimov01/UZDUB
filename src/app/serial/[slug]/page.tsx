import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_MOVIES } from "@/lib/demo-data";
import SerialDetail from "@/components/movie/SerialDetail";
import JsonLd from "@/components/seo/JsonLd";
import { buildMovieMetadata, buildMovieJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const serial = DEMO_MOVIES.find((m) => m.slug === slug && m.type === "SERIAL");
  if (!serial) return { title: "Topilmadi" };
  return buildMovieMetadata(serial);
}

export default async function SerialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const serial = DEMO_MOVIES.find((m) => m.slug === slug && m.type === "SERIAL");
  if (!serial) notFound();
  return (
    <>
      <JsonLd data={buildMovieJsonLd(serial)} />
      <SerialDetail serial={serial} />
    </>
  );
}
