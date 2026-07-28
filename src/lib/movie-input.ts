import { z } from "zod";
import { randomUUID } from "crypto";
import type { Genre, Episode } from "@/types/movie";

// Admin formadagi janr nomlari -> slug (demo-data bilan mos)
export const GENRE_SLUGS: Record<string, string> = {
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

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function mapGenres(names: string[]): Genre[] {
  return names.map((name, idx) => ({
    id: String(idx + 1),
    name,
    slug: GENRE_SLUGS[name] ?? slugify(name),
  }));
}

// Kino qo'shish/tahrirlash uchun kirish sxemasi (bir xil)
export const MovieInput = z.object({
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
  episodes: z
    .array(
      z.object({
        id: z.string().optional(),
        season: z.coerce.number().int().min(1).max(100).optional().default(1),
        episode: z.coerce.number().int().min(1).max(1000),
        title: z.string().trim().max(200).optional().default(""),
        description: z.string().trim().max(3000).optional().default(""),
        videoUrl: z.string().trim().max(2000).optional().default(""),
        duration: z.coerce.number().int().min(0).max(100000).optional(),
      })
    )
    .max(1000)
    .optional()
    .default([]),
});

export type MovieInputData = z.infer<typeof MovieInput>;

// Forma qismlarini to'liq Episode obyektlariga aylantirish
export function mapEpisodes(input: MovieInputData["episodes"], movieId: string): Episode[] {
  return (input ?? []).map((e) => ({
    id: e.id || randomUUID(),
    movieId,
    season: e.season ?? 1,
    episode: e.episode,
    title: e.title || `${e.episode}-qism`,
    description: e.description || undefined,
    videoUrl: e.videoUrl || undefined,
    duration: e.duration,
    viewCount: 0,
  }));
}
