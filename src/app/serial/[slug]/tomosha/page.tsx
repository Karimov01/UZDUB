import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DEMO_MOVIES } from "@/lib/demo-data";
import SerialTomashaClient from "@/components/player/SerialTomashaClient";

export default async function SerialTomashaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const serial = DEMO_MOVIES.find((m) => m.slug === slug && m.type === "SERIAL");
  if (!serial) notFound();
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SerialTomashaClient serial={serial} />
    </Suspense>
  );
}
