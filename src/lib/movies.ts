import { cache } from "react";
import type { Movie } from "@/types/movie";
import { readMovies } from "@/lib/movies-store";

// Baza + demo kinolar. React cache — bir render ichida bitta DB o'qish.
// Baza uzilgan bo'lsa ham demo bilan ishlayveradi (try/catch).
const loadAll = cache(async (): Promise<Movie[]> => {
  try {
    return await readMovies();
  } catch {
    return [];
  }
});

/** Barcha kinolar (barcha status) — admin uchun. */
export async function getAllMovies(): Promise<Movie[]> {
  return loadAll();
}

/** Faqat nashr etilgan (PUBLISHED) — ommaviy sahifalar uchun. */
export async function getPublishedMovies(): Promise<Movie[]> {
  return (await loadAll()).filter((m) => m.status === "PUBLISHED");
}

export async function getMovieBySlug(slug: string): Promise<Movie | undefined> {
  return (await getPublishedMovies()).find((m) => m.slug === slug);
}

export async function getSerialBySlug(slug: string): Promise<Movie | undefined> {
  return (await getPublishedMovies()).find((m) => m.slug === slug && m.type === "SERIAL");
}

export async function getFeatured(): Promise<Movie[]> {
  return (await getPublishedMovies()).filter((m) => m.isFeatured);
}

export async function getTrending(): Promise<Movie[]> {
  return (await getPublishedMovies()).filter((m) => m.isTrending);
}

export async function getSerials(): Promise<Movie[]> {
  return (await getPublishedMovies()).filter((m) => m.type === "SERIAL");
}

export async function getKinolar(): Promise<Movie[]> {
  return (await getPublishedMovies()).filter((m) => m.type === "MOVIE");
}
