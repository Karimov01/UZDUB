import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { Movie, ContentType, ContentStatus } from "@/types/movie";
import { readMovies, addMovie, slugExists } from "@/lib/movies-store";

export const runtime = "nodejs";

// Admin formadagi janr nomlari -> slug (demo-data bilan mos)
const GENRE_SLUGS: Record<string, string> = {
  Drama: "drama",
  Harakatli: "harakatli",
  Triller: "triller",
  "Ilmiy fantastika": "ilmiy-fantastika",
  Fantastik: "fantastik",
  Jinoyat: "jinoyat",
  Komediya: "komediya",
  Romantik: "romantik",
  Tarix: "tarix",
  Multfilm: "multfilm",
  Dahshat: "dahshat",
  Musiqa: "musiqa",
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CreateMovie = z.object({
  title: z.string().trim().min(1, "Nomi majburiy").max(200),
  originalTitle: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(5000).optional().default(""),
  shortDesc: z.string().trim().max(500).optional().default(""),
  type: z.enum(["MOVIE", "SERIAL", "CARTOON", "DOCUMENTARY", "SHOW"]).default("MOVIE"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  year: z.coerce.number().int().min(1870).max(2100).optional(),
  duration: z.coerce.number().int().min(0).max(100000).optional(),
  country: z.string().trim().max(100).optional().default(""),
  language: z.string().trim().max(100).optional().default(""),
  dubbing: z.string().trim().max(100).optional().default(""),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  posterUrl: z.string().trim().max(2000).optional().default(""),
  backdropUrl: z.string().trim().max(2000).optional().default(""),
  videoUrl: z.string().trim().max(2000).optional().default(""),
  trailerUrl: z.string().trim().max(2000).optional().default(""),
  genres: z.array(z.string()).max(20).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isTrending: z.boolean().optional().default(false),
  isPremium: z.boolean().optional().default(false),
});

export async function GET() {
  const movies = await readMovies();
  return NextResponse.json({ movies });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const parsed = CreateMovie.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const d = parsed.data;

  // Noyob slug yaratish (asl nomdan afzal, keyin nomdan)
  const base = slugify(d.originalTitle || d.title) || `kino-${Date.now()}`;
  let slug = base;
  let i = 2;
  while (await slugExists(slug)) {
    slug = `${base}-${i++}`;
  }

  const movie: Movie = {
    id: randomUUID(),
    slug,
    title: d.title,
    originalTitle: d.originalTitle || undefined,
    description: d.description,
    shortDesc: d.shortDesc || undefined,
    posterUrl: d.posterUrl || undefined,
    backdropUrl: d.backdropUrl || undefined,
    videoUrl: d.videoUrl || undefined,
    trailerUrl: d.trailerUrl || undefined,
    type: d.type as ContentType,
    status: d.status as ContentStatus,
    year: d.year,
    duration: d.duration,
    country: d.country || undefined,
    language: d.language || undefined,
    dubbing: d.dubbing || undefined,
    imdbRating: d.imdbRating,
    viewCount: 0,
    isFeatured: d.isFeatured,
    isTrending: d.isTrending,
    isPremium: d.isPremium,
    genres: d.genres.map((name, idx) => ({
      id: String(idx + 1),
      name,
      slug: GENRE_SLUGS[name] ?? slugify(name),
    })),
  };

  try {
    await addMovie(movie);
  } catch {
    // Vercel serverless'da fayl tizimi yozib bo'lmaydi — doimiy baza kerak
    return NextResponse.json(
      { error: "Saqlab bo'lmadi. Production'da doimiy baza (PostgreSQL) ulang." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, movie });
}
