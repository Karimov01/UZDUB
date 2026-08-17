import { randomUUID } from "node:crypto";
import type { ContentType, Episode, Movie } from "@/types/movie";
import { fillMovieMetadata } from "@/lib/ai-movie-fill";
import { addMovie, readMovies, slugExists, updateMovie } from "@/lib/movies-store";
import { mapGenres, slugify } from "@/lib/movie-input";
import { createAutomaticSeo } from "@/lib/seo";

export type PublisherContentType = "movie" | "serial";
export type PublisherIdentity = {
  type: PublisherContentType;
  title: string;
  originalTitle: string;
  year: number;
};
export type PublisherMatch = {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
};
export type PublisherFindResult =
  | { status: "found"; contentId: string }
  | { status: "multiple_matches"; matches: PublisherMatch[] }
  | { status: "not_found"; requiredFields: ["title", "originalTitle", "year"] };

const REQUIRED_FIELDS = ["title", "originalTitle", "year"] as const;

export async function findPublisherContent(input: PublisherIdentity): Promise<PublisherFindResult> {
  const expectedType: ContentType = input.type === "serial" ? "SERIAL" : "MOVIE";
  const title = normalizeTitle(input.title);
  const originalTitle = normalizeTitle(input.originalTitle);
  const matches = (await readMovies())
    .filter((movie) => movie.type === expectedType && movie.year === input.year)
    .filter((movie) => isIdentityMatch(title, originalTitle, movie))
    .map(toPublisherMatch);

  if (matches.length === 1) return { status: "found", contentId: matches[0].id };
  if (matches.length > 1) return { status: "multiple_matches", matches };
  return { status: "not_found", requiredFields: [...REQUIRED_FIELDS] };
}

export async function createPublisherContent(input: PublisherIdentity): Promise<
  | PublisherFindResult
  | { status: "created"; contentId: string; draftStatus: "DRAFT" }
> {
  const duplicate = await findPublisherContent(input);
  if (duplicate.status !== "not_found") return duplicate;

  const type: ContentType = input.type === "serial" ? "SERIAL" : "MOVIE";
  let filled;
  try {
    filled = await fillMovieMetadata({
      title: input.title,
      originalTitle: input.originalTitle,
      year: input.year,
      type,
    });
  } catch {
    throw new PublisherError("AI_ENRICHMENT_FAILED", 502);
  }

  // AI chaqiruvi vaqtida boshqa request shu kontentni yaratgan bo'lishi mumkin.
  // Saqlash oldidan yana tekshirib, eng ko'p uchraydigan parallel duplicate'ni to'xtatamiz.
  const duplicateAfterFill = await findPublisherContent(input);
  if (duplicateAfterFill.status !== "not_found") return duplicateAfterFill;
  const description = filled.description;
  const shortDesc = filled.shortDesc;
  const seo = createAutomaticSeo({
    title: input.title,
    year: input.year,
    type,
    shortDesc,
    description,
  });
  const id = randomUUID();
  const slug = await availableSlug(input.title, input.originalTitle);
  const now = new Date().toISOString();
  const movie: Movie = {
    id,
    slug,
    title: input.title,
    originalTitle: input.originalTitle,
    year: input.year,
    type,
    status: "DRAFT",
    description,
    shortDesc,
    posterUrl: filled.posterUrl,
    backdropUrl: filled.backdropUrl,
    duration: filled.duration,
    country: filled.country,
    language: filled.language,
    dubbing: filled.dubbing,
    imdbRating: filled.imdbRating,
    genres: mapGenres(filled.genres),
    episodes: [],
    viewCount: 0,
    isFeatured: false,
    isTrending: false,
    isPremium: false,
    ...seo,
    createdAt: now,
    updatedAt: now,
  };
  await addMovie(movie);
  return { status: "created", contentId: id, draftStatus: "DRAFT" };
}

export async function upsertPublisherEpisode(input: {
  contentId: string;
  season?: number;
  episode: number;
  moverWatchUrl?: string | null;
  moverEmbedUrl?: string | null;
  publicUrl?: string | null;
}): Promise<{ success: true; action: "created" | "updated"; episode: number; season: number; slug: string }> {
  const movies = await readMovies();
  const serial = movies.find((movie) => movie.id === input.contentId);
  if (!serial) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (serial.type !== "SERIAL") throw new PublisherError("CONTENT_TYPE_MISMATCH", 409);

  const season = input.season ?? 1;
  const playerUrl = preferredPlayerUrl(input);
  const existing = serial.episodes?.find(
    (item) => item.season === season && item.episode === input.episode,
  );
  const now = new Date().toISOString();
  const episode: Episode = {
    ...existing,
    id: existing?.id ?? randomUUID(),
    movieId: serial.id,
    season,
    episode: input.episode,
    title: existing?.title || `${input.episode}-qism`,
    videoUrl: playerUrl,
    viewCount: existing?.viewCount ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const episodes = existing
    ? (serial.episodes ?? []).map((item) => item.id === existing.id ? episode : item)
    : [...(serial.episodes ?? []), episode];
  await updateMovie(serial.id, { ...serial, episodes, updatedAt: now });
  return {
    success: true,
    action: existing ? "updated" : "created",
    episode: input.episode,
    season,
    slug: serial.slug,
  };
}

export async function updatePublisherMovieVideo(input: {
  contentId: string;
  moverWatchUrl?: string | null;
  moverEmbedUrl?: string | null;
  publicUrl?: string | null;
}): Promise<{ success: true; action: "updated"; contentId: string; slug: string }> {
  const movies = await readMovies();
  const movie = movies.find((item) => item.id === input.contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (movie.type !== "MOVIE") throw new PublisherError("CONTENT_TYPE_MISMATCH", 409);
  await updateMovie(movie.id, {
    ...movie,
    videoUrl: preferredPlayerUrl(input),
    updatedAt: new Date().toISOString(),
  });
  return { success: true, action: "updated", contentId: movie.id, slug: movie.slug };
}

export class PublisherError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
  }
}

function preferredPlayerUrl(input: {
  moverWatchUrl?: string | null;
  moverEmbedUrl?: string | null;
  publicUrl?: string | null;
}): string {
  const url = input.moverEmbedUrl || input.publicUrl || input.moverWatchUrl;
  if (!url) throw new PublisherError("VIDEO_URL_REQUIRED", 400);
  return url;
}

async function availableSlug(title: string, originalTitle: string): Promise<string> {
  const base = slugify(title) || slugify(originalTitle) || `kontent-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (await slugExists(slug)) slug = `${base}-${suffix++}`;
  return slug;
}

function toPublisherMatch(movie: Movie): PublisherMatch {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle ?? "",
    year: movie.year!,
  };
}

function isIdentityMatch(title: string, originalTitle: string, movie: Movie): boolean {
  const candidateTitle = normalizeTitle(movie.title);
  const candidateOriginal = normalizeTitle(movie.originalTitle ?? "");
  const titleScore = similarity(title, candidateTitle);
  const originalScore = similarity(originalTitle, candidateOriginal);
  return (
    (titleScore === 1 && originalScore >= 0.78) ||
    (originalScore === 1 && titleScore >= 0.78) ||
    (titleScore >= 0.88 && originalScore >= 0.88)
  );
}

export function normalizeTitle(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("uz")
    .replace(/[ʻʼ’‘`´']/g, "")
    .replace(/\b(seriali|serial|filmi|film|kino)\b/giu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function similarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const rows = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = rows[0];
    rows[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = rows[j];
      rows[j] = Math.min(
        rows[j] + 1,
        rows[j - 1] + 1,
        previous + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      previous = saved;
    }
  }
  return 1 - rows[right.length] / Math.max(left.length, right.length);
}
