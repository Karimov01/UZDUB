import { notFound } from "next/navigation";
import { getMovieBySlug } from "@/lib/movies";
import TomashaClient from "@/components/player/TomashaClient";

export const revalidate = 60;

export default async function TomashaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();
  return <TomashaClient movie={movie} />;
}
