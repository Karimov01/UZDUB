import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovie } from "@/lib/movies-store";
import EditMovieForm from "@/components/admin/EditMovieForm";

export const metadata: Metadata = { title: "Tahrirlash" };

export default async function EditKinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let dbMovie;
  try {
    dbMovie = await getMovie(id);
  } catch {
    dbMovie = undefined;
  }
  if (!dbMovie) notFound();

  // Faqat bazadagi kinolar tahrirlanadi (demo — namuna)
  return <EditMovieForm movie={dbMovie} editable />;
}
