import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSerialBySlug } from "@/lib/movies";
import SerialTomashaClient from "@/components/player/SerialTomashaClient";

export const revalidate = 60;

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
