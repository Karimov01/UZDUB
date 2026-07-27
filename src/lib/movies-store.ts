import { promises as fs } from "fs";
import path from "path";
import type { Movie } from "@/types/movie";

// Lokal JSON saqlash (akkauntsiz, Windows'da native modulsiz).
// Production'da src/app/api/movies/route.ts ni Prisma + PostgreSQL bilan almashtiring.
const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "movies.json");

export async function readMovies(): Promise<Movie[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Movie[]) : [];
  } catch {
    return [];
  }
}

export async function addMovie(movie: Movie): Promise<void> {
  const movies = await readMovies();
  movies.unshift(movie);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(movies, null, 2), "utf8");
}

export async function slugExists(slug: string): Promise<boolean> {
  const movies = await readMovies();
  return movies.some((m) => m.slug === slug);
}
