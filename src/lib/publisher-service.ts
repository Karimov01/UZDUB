import { randomUUID } from "node:crypto";
import type { ContentType, Episode, Movie } from "@/types/movie";
import { fillMovieMetadata } from "@/lib/ai-movie-fill";
import { fillEpisodeMetadata } from "@/lib/ai-episode-fill";
import {
  addMovie,
  createPublisherPlayerHistory,
  getPublisherPlayerHistory,
  markPublisherPlayerHistoryUndone,
  readMovies,
  slugExists,
  updateMovie,
} from "@/lib/movies-store";
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

export async function searchPublisherContent(input: {
  type: PublisherContentType; title: string; originalTitle?: string; year?: number;
}): Promise<{ status: "matches" | "not_found"; matches: PublisherMatch[] }> {
  const expectedType: ContentType = input.type === "serial" ? "SERIAL" : "MOVIE";
  const title = normalizeTitle(input.title);
  const originalTitle = normalizeTitle(input.originalTitle ?? "");
  const matches = (await readMovies())
    .filter((movie) => movie.type === expectedType)
    .filter((movie) => !input.year || movie.year === input.year)
    .map((movie) => ({ movie, score: searchScore(title, originalTitle, movie) }))
    .filter(({ score }) => score >= 0.55)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map(({ movie }) => toPublisherMatch(movie));
  return { status: matches.length ? "matches" : "not_found", matches };
}

export async function inspectPublisherContent(input: {
  contentId: string; season?: number; episode?: number;
}): Promise<{
  contentId: string; type: "movie" | "serial"; title: string; originalTitle: string;
  year?: number; slug: string; siteUrl: string; adminUrl: string; playerUrl?: string;
  status: string; posterUrl?: string; description?: string;
  episodes?: { id: string; season: number; episode: number; title: string; playerUrl?: string }[];
  episode?: { id: string; season: number; episode: number; title: string; playerUrl?: string };
}> {
  const movie = (await readMovies()).find((item) => item.id === input.contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  const type = movie.type === "SERIAL" ? "serial" : "movie";
  if (type === "serial" && input.episode) {
    const season = input.season ?? 1;
    const episode = movie.episodes?.find(
      (item) => item.season === season && item.episode === input.episode,
    );
    return {
      contentId: movie.id, type, title: movie.title, originalTitle: movie.originalTitle ?? "",
      year: movie.year, slug: movie.slug, siteUrl: siteUrl(movie), adminUrl: adminUrl(movie.id),
      status: movie.status, posterUrl: movie.posterUrl, description: movie.description,
      ...(episode ? { episode: { id: episode.id, season, episode: episode.episode, title: episode.title, playerUrl: episode.videoUrl } } : {}),
    };
  }
  return {
    contentId: movie.id, type, title: movie.title, originalTitle: movie.originalTitle ?? "",
    year: movie.year, slug: movie.slug, siteUrl: siteUrl(movie), adminUrl: adminUrl(movie.id),
    status: movie.status, posterUrl: movie.posterUrl, description: movie.description,
    playerUrl: movie.videoUrl,
    ...(type === "serial" ? { episodes: (movie.episodes ?? []).map((episode) => ({
      id: episode.id, season: episode.season, episode: episode.episode,
      title: episode.title, playerUrl: episode.videoUrl,
    })).sort((left, right) => left.episode - right.episode) } : {}),
  };
}

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
}): Promise<{ success: true; action: "created" | "updated" | "unchanged"; episode: number; season: number; slug: string; contentId: string; episodeId: string; oldPlayerUrl?: string; newPlayerUrl: string; historyId?: string; siteUrl: string; adminUrl: string }> {
  const movies = await readMovies();
  const serial = movies.find((movie) => movie.id === input.contentId);
  if (!serial) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (serial.type !== "SERIAL") throw new PublisherError("CONTENT_TYPE_MISMATCH", 409);

  const season = input.season ?? 1;
  const playerUrl = preferredPlayerUrl(input);
  const existing = serial.episodes?.find(
    (item) => item.season === season && item.episode === input.episode,
  );
  if (existing?.videoUrl === playerUrl) {
    return { success: true, action: "unchanged", episode: input.episode, season, slug: serial.slug, contentId: serial.id, episodeId: existing.id, oldPlayerUrl: existing.videoUrl, newPlayerUrl: playerUrl, siteUrl: siteUrl(serial), adminUrl: adminUrl(serial.id) };
  }
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
  const historyId = existing?.videoUrl ? randomUUID() : undefined;
  if (historyId && existing?.videoUrl) {
    await createPublisherPlayerHistory({ id: historyId, contentId: serial.id, episodeId: episode.id, season, episode: input.episode, oldPlayerUrl: existing.videoUrl, newPlayerUrl: playerUrl });
  }
  return {
    success: true,
    action: existing ? "updated" : "created",
    episode: input.episode,
    season,
    slug: serial.slug,
    contentId: serial.id,
    episodeId: episode.id,
    oldPlayerUrl: existing?.videoUrl,
    newPlayerUrl: playerUrl,
    historyId,
    siteUrl: siteUrl(serial),
    adminUrl: adminUrl(serial.id),
  };
}

export type PublisherEpisodeIssue = {
  episodeId: string; season: number; episode: number; playerUrl?: string;
  duration?: number; aiProcessed: boolean; missingPlayer: boolean;
  missingDuration: boolean; missingAi: boolean; missingRequiredFields: string[];
};

export type PublisherSerialHealth = {
  contentId: string; title: string; originalTitle: string; year?: number;
  siteUrl: string; adminUrl: string; totalEpisodes: number;
  playerOk: number; durationOk: number; aiOk: number; issues: PublisherEpisodeIssue[];
};

export function episodeAiProcessed(episode: Episode): boolean {
  if (episode.aiProcessedAt) return true;
  const defaultTitle = `${episode.episode}-qism`;
  return Boolean(episode.description?.trim() && episode.title?.trim() && episode.title.trim() !== defaultTitle);
}

function episodeIssue(episode: Episode): PublisherEpisodeIssue {
  const missingPlayer = !episode.videoUrl?.trim();
  const missingDuration = !Number.isInteger(episode.duration) || (episode.duration ?? 0) <= 0;
  const missingAi = !episodeAiProcessed(episode);
  const missingRequiredFields: string[] = [];
  if (!episode.title?.trim()) missingRequiredFields.push("title");
  if (!episode.description?.trim()) missingRequiredFields.push("description");
  return {
    episodeId: episode.id, season: episode.season, episode: episode.episode,
    playerUrl: episode.videoUrl, duration: episode.duration, aiProcessed: !missingAi,
    missingPlayer, missingDuration, missingAi, missingRequiredFields,
  };
}

export async function inspectPublisherSerialHealth(contentId: string): Promise<PublisherSerialHealth> {
  const serial = (await readMovies()).find((item) => item.id === contentId);
  if (!serial) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (serial.type !== "SERIAL") throw new PublisherError("CONTENT_TYPE_MISMATCH", 409);
  const episodes = [...(serial.episodes ?? [])].sort((a, b) => a.season - b.season || a.episode - b.episode);
  const all = episodes.map(episodeIssue);
  return {
    contentId: serial.id, title: serial.title, originalTitle: serial.originalTitle ?? "",
    year: serial.year, siteUrl: siteUrl(serial), adminUrl: adminUrl(serial.id),
    totalEpisodes: all.length,
    playerOk: all.filter((item) => !item.missingPlayer).length,
    durationOk: all.filter((item) => !item.missingDuration).length,
    aiOk: all.filter((item) => !item.missingAi).length,
    // Return every episode so Telegram can render a complete, paginated audit.
    // Each row carries deterministic missing flags and doubles as the issue model.
    issues: all,
  };
}

export async function repairPublisherSerialEpisode(input: {
  contentId: string; episodeId: string; repairAi?: boolean; duration?: number; dryRun?: boolean;
}): Promise<{
  success: true; action: "updated" | "unchanged" | "dry_run"; episodeId: string;
  episode: number; aiRepaired: boolean; durationRepaired: boolean; playerUnchanged: boolean;
  issue: PublisherEpisodeIssue;
}> {
  const serial = (await readMovies()).find((item) => item.id === input.contentId);
  if (!serial) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (serial.type !== "SERIAL") throw new PublisherError("CONTENT_TYPE_MISMATCH", 409);
  const current = serial.episodes?.find((item) => item.id === input.episodeId);
  if (!current) throw new PublisherError("EPISODE_NOT_FOUND", 404);
  const before = episodeIssue(current); const oldPlayer = current.videoUrl;
  const shouldAi = Boolean(input.repairAi && before.missingAi);
  const validDuration = Number.isInteger(input.duration) && (input.duration ?? 0) > 0 ? input.duration : undefined;
  const shouldDuration = Boolean(before.missingDuration && validDuration);
  if (input.dryRun) return { success: true, action: "dry_run", episodeId: current.id, episode: current.episode, aiRepaired: shouldAi, durationRepaired: shouldDuration, playerUnchanged: true, issue: before };
  let next: Episode = { ...current };
  if (shouldAi) {
    let filled;
    try { filled = await fillEpisodeMetadata({ serialTitle: serial.title, originalTitle: serial.originalTitle, title: current.title, season: current.season, episode: current.episode }); }
    catch { throw new PublisherError("EPISODE_AI_FAILED", 502); }
    next = { ...next, title: filled.title, description: filled.description, aiProcessedAt: filled.aiProcessedAt };
  }
  if (shouldDuration) next = { ...next, duration: validDuration };
  if (!shouldAi && !shouldDuration) return { success: true, action: "unchanged", episodeId: current.id, episode: current.episode, aiRepaired: false, durationRepaired: false, playerUnchanged: true, issue: before };
  next = { ...next, updatedAt: new Date().toISOString() };
  const episodes = (serial.episodes ?? []).map((item) => item.id === current.id ? next : item);
  await updateMovie(serial.id, { ...serial, episodes, updatedAt: next.updatedAt });
  const savedSerial = (await readMovies()).find((item) => item.id === serial.id);
  const saved = savedSerial?.episodes?.find((item) => item.id === current.id);
  if (!saved || saved.videoUrl !== oldPlayer) throw new PublisherError("PLAYER_PROTECTION_FAILED", 500);
  const after = episodeIssue(saved);
  if (shouldAi && after.missingAi) throw new PublisherError("EPISODE_AI_VERIFY_FAILED", 502);
  if (shouldDuration && after.missingDuration) throw new PublisherError("EPISODE_DURATION_VERIFY_FAILED", 500);
  return { success: true, action: "updated", episodeId: saved.id, episode: saved.episode, aiRepaired: shouldAi, durationRepaired: shouldDuration, playerUnchanged: true, issue: after };
}

export async function updatePublisherMovieVideo(input: {
  contentId: string;
  moverWatchUrl?: string | null;
  moverEmbedUrl?: string | null;
  publicUrl?: string | null;
}): Promise<{ success: true; action: "updated" | "unchanged"; contentId: string; slug: string; oldPlayerUrl?: string; newPlayerUrl: string; historyId?: string; siteUrl: string; adminUrl: string }> {
  const movies = await readMovies();
  const movie = movies.find((item) => item.id === input.contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (movie.type !== "MOVIE") throw new PublisherError("CONTENT_TYPE_MISMATCH", 409);
  const playerUrl = preferredPlayerUrl(input);
  if (movie.videoUrl === playerUrl) {
    return { success: true, action: "unchanged", contentId: movie.id, slug: movie.slug, oldPlayerUrl: movie.videoUrl, newPlayerUrl: playerUrl, siteUrl: siteUrl(movie), adminUrl: adminUrl(movie.id) };
  }
  await updateMovie(movie.id, {
    ...movie,
    videoUrl: playerUrl,
    updatedAt: new Date().toISOString(),
  });
  const historyId = movie.videoUrl ? randomUUID() : undefined;
  if (historyId && movie.videoUrl) await createPublisherPlayerHistory({ id: historyId, contentId: movie.id, oldPlayerUrl: movie.videoUrl, newPlayerUrl: playerUrl });
  return { success: true, action: "updated", contentId: movie.id, slug: movie.slug, oldPlayerUrl: movie.videoUrl, newPlayerUrl: playerUrl, historyId, siteUrl: siteUrl(movie), adminUrl: adminUrl(movie.id) };
}

export async function undoPublisherPlayer(historyId: string): Promise<{ success: true; action: "restored"; contentId: string; playerUrl: string; siteUrl: string }> {
  const history = await getPublisherPlayerHistory(historyId);
  if (!history) throw new PublisherError("HISTORY_NOT_FOUND", 404);
  if (history.undoneAt) throw new PublisherError("HISTORY_ALREADY_UNDONE", 409);
  const movie = (await readMovies()).find((item) => item.id === history.contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (history.episodeId) {
    const current = movie.episodes?.find((item) => item.id === history.episodeId);
    if (!current) throw new PublisherError("EPISODE_NOT_FOUND", 404);
    if (current.videoUrl !== history.newPlayerUrl) throw new PublisherError("PLAYER_CHANGED_AFTER_HISTORY", 409);
    const episodes = (movie.episodes ?? []).map((item) => item.id === current.id ? { ...item, videoUrl: history.oldPlayerUrl, updatedAt: new Date().toISOString() } : item);
    await updateMovie(movie.id, { ...movie, episodes, updatedAt: new Date().toISOString() });
  } else {
    if (movie.videoUrl !== history.newPlayerUrl) throw new PublisherError("PLAYER_CHANGED_AFTER_HISTORY", 409);
    await updateMovie(movie.id, { ...movie, videoUrl: history.oldPlayerUrl, updatedAt: new Date().toISOString() });
  }
  if (!await markPublisherPlayerHistoryUndone(historyId)) throw new PublisherError("HISTORY_ALREADY_UNDONE", 409);
  return { success: true, action: "restored", contentId: movie.id, playerUrl: history.oldPlayerUrl, siteUrl: siteUrl(movie) };
}

export async function publishPublisherContent(contentId: string): Promise<{
  success: true; action: "published" | "unchanged"; contentId: string; title: string;
  year?: number; siteUrl: string; adminUrl: string;
}> {
  const movie = (await readMovies()).find((item) => item.id === contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (movie.status === "ARCHIVED") throw new PublisherError("ARCHIVED_CONTENT_CANNOT_PUBLISH", 409);
  if (movie.status === "PUBLISHED") return { success: true, action: "unchanged", contentId, title: movie.title, year: movie.year, siteUrl: siteUrl(movie), adminUrl: adminUrl(movie.id) };
  const now = new Date().toISOString();
  await updateMovie(movie.id, { ...movie, status: "PUBLISHED", publishedAt: movie.publishedAt ?? now, updatedAt: now });
  return { success: true, action: "published", contentId, title: movie.title, year: movie.year, siteUrl: siteUrl(movie), adminUrl: adminUrl(movie.id) };
}

export async function editPublisherDraft(input: {
  contentId: string; title?: string; originalTitle?: string; year?: number;
  description?: string; posterUrl?: string;
}): Promise<Awaited<ReturnType<typeof inspectPublisherContent>>> {
  const movie = (await readMovies()).find((item) => item.id === input.contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (movie.status !== "DRAFT") throw new PublisherError("DRAFT_REQUIRED", 409);
  const next = { ...movie, updatedAt: new Date().toISOString() };
  if (input.title !== undefined) next.title = input.title;
  if (input.originalTitle !== undefined) next.originalTitle = input.originalTitle;
  if (input.year !== undefined) next.year = input.year;
  if (input.description !== undefined) next.description = input.description;
  if (input.posterUrl !== undefined) next.posterUrl = input.posterUrl;
  await updateMovie(movie.id, next);
  return inspectPublisherContent({ contentId: movie.id });
}

export async function refillPublisherAi(input: { contentId: string; preserveFields?: string[] }): Promise<Awaited<ReturnType<typeof inspectPublisherContent>>> {
  const movie = (await readMovies()).find((item) => item.id === input.contentId);
  if (!movie) throw new PublisherError("CONTENT_NOT_FOUND", 404);
  if (movie.status !== "DRAFT") throw new PublisherError("DRAFT_REQUIRED", 409);
  if (!movie.title || !movie.originalTitle || !movie.year) throw new PublisherError("IDENTITY_FIELDS_REQUIRED", 400);
  let filled;
  try { filled = await fillMovieMetadata({ title: movie.title, originalTitle: movie.originalTitle, year: movie.year, type: movie.type === "SERIAL" ? "SERIAL" : "MOVIE" }); }
  catch { throw new PublisherError("AI_ENRICHMENT_FAILED", 502); }
  const preserve = new Set(input.preserveFields ?? []);
  const next: Movie = {
    ...movie,
    description: preserve.has("description") ? movie.description : filled.description,
    shortDesc: preserve.has("shortDesc") ? movie.shortDesc : filled.shortDesc,
    posterUrl: preserve.has("posterUrl") ? movie.posterUrl : filled.posterUrl,
    backdropUrl: preserve.has("backdropUrl") ? movie.backdropUrl : filled.backdropUrl,
    duration: preserve.has("duration") ? movie.duration : filled.duration,
    country: preserve.has("country") ? movie.country : filled.country,
    language: preserve.has("language") ? movie.language : filled.language,
    dubbing: preserve.has("dubbing") ? movie.dubbing : filled.dubbing,
    imdbRating: preserve.has("imdbRating") ? movie.imdbRating : filled.imdbRating,
    genres: preserve.has("genres") ? movie.genres : mapGenres(filled.genres),
    updatedAt: new Date().toISOString(),
  };
  await updateMovie(movie.id, next);
  return inspectPublisherContent({ contentId: movie.id });
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
    originalScore === 1 ||
    (titleScore === 1 && originalScore >= 0.78) ||
    (titleScore >= 0.88 && originalScore >= 0.88)
  );
}

function searchScore(title: string, originalTitle: string, movie: Movie): number {
  const candidates = [normalizeTitle(movie.title), normalizeTitle(movie.originalTitle ?? "")].filter(Boolean);
  const titleScore = Math.max(...candidates.map((candidate) => flexibleSimilarity(title, candidate)), 0);
  const originalScore = originalTitle ? Math.max(...candidates.map((candidate) => flexibleSimilarity(originalTitle, candidate)), 0) : 0;
  return Math.max(titleScore, originalScore);
}

function flexibleSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.92;
  return similarity(left, right);
}

function siteUrl(movie: Movie): string { return `https://uzdub.com/${movie.type === "SERIAL" ? "serial" : "kino"}/${movie.slug}`; }
function adminUrl(contentId: string): string { return `https://uzdub.com/admin/kinolar/${contentId}`; }

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
