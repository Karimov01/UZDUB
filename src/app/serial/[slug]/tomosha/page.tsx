import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSerialBySlug } from "@/lib/movies";
import SerialTomashaClient from "@/components/player/SerialTomashaClient";
import { buildMovieMetadata } from "@/lib/seo";

export const revalidate = 60;

// Bu eski umumiy tomosha marshruti qism sahifalaridan duplicate bo'lmasligi uchun
// asosiy serial sahifasiga canonical qilinadi va indekslanmaydi.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const serial = await getSerialBySlug(slug);
  if (!serial) return { title: "Serial topilmadi", robots: { index: false, follow: false } };
  return { ...buildMovieMetadata(serial), robots: { index: false, follow: true } };
}

export default async function SerialTomashaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const serial = await getSerialBySlug(slug);
  if (!serial) notFound();
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SerialTomashaClient serial={serial} />
    </Suspense>
  );
}
