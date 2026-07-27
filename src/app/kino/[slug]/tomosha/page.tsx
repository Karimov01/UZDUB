import { notFound } from "next/navigation";
import { DEMO_MOVIES } from "@/lib/demo-data";
import TomashaClient from "@/components/player/TomashaClient";

export default async function TomashaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = DEMO_MOVIES.find((m) => m.slug === slug);
  if (!movie) notFound();
  return <TomashaClient movie={movie} />;
}
