import { cache } from "react";
import type { Episode, HeroMovieData, Movie, MovieCardData } from "@/types/movie";
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
  return (await loadAll()).filter((m) => m.status === "PUBLISHED" && !m.isComingSoon);
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

export async function getComingSoon(): Promise<Movie[]> {
  return (await loadAll()).filter((movie) => movie.isComingSoon && movie.status !== "ARCHIVED");
}

export function toCardData(movie: Movie): MovieCardData {
  const latestEpisode = [...(movie.episodes ?? [])]
    .filter((episode) => Boolean(episode.videoUrl?.trim()))
    .sort((a, b) => b.season - a.season || b.episode - a.episode)[0];

  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    status: movie.status,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    shortDesc: movie.shortDesc,
    type: movie.type,
    year: movie.year,
    duration: movie.duration,
    imdbRating: movie.imdbRating,
    viewCount: movie.viewCount,
    isTrending: movie.isTrending,
    isPremium: movie.isPremium,
    isComingSoon: movie.isComingSoon,
    isRussian: movie.isRussian,
    publishedAt: movie.publishedAt,
    genres: movie.genres,
    latestSeason: latestEpisode?.season,
    latestEpisode: latestEpisode?.episode,
  };
}

function toHeroData(movie: Movie): HeroMovieData {
  return {
    ...toCardData(movie),
    backdropUrl: movie.backdropUrl,
    shortDesc: movie.shortDesc,
    country: movie.country,
    dubbing: movie.dubbing,
    isFeatured: movie.isFeatured,
    genres: movie.genres?.slice(0, 1),
  };
}

export interface HomePageData {
  featured: HeroMovieData[];
  mostViewed: MovieCardData[];
  trending: MovieCardData[];
  serials: MovieCardData[];
  newest: MovieCardData[];
  topMovies: MovieCardData[];
  topSerials: MovieCardData[];
  comingSoon: MovieCardData[];
  latestEpisodes: LatestEpisode[];
}

export interface LatestEpisode {
  serial: MovieCardData & Pick<Movie, "backdropUrl">;
  episode: Pick<Episode, "id" | "season" | "episode" | "title" | "previewUrl" | "duration" | "viewCount" | "createdAt" | "updatedAt">;
  addedAt: string;
}

function episodeTimestamp(serial: Movie, episode: Episode): string {
  return episode.createdAt ?? episode.airDate ?? serial.createdAt ?? "1970-01-01T00:00:00.000Z";
}

function timestampValue(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/** Qo'shilgan vaqt, fasl, qism va ID bo'yicha barqaror kamayish tartibi. */
function compareLatestEpisodes(a: LatestEpisode, b: LatestEpisode): number {
  return timestampValue(b.addedAt) - timestampValue(a.addedAt)
    || b.episode.season - a.episode.season
    || b.episode.episode - a.episode.episode
    || b.episode.id.localeCompare(a.episode.id);
}

/** Faqat tomosha havolasi berilgan serial qismlarini yangi qo'shilganidan saralaydi. */
export function getLatestEpisodesFromMovies(movies: Movie[], limit = 24): LatestEpisode[] {
  return movies
    .filter((movie) => movie.type === "SERIAL")
    .flatMap((serial) => (serial.episodes ?? [])
      .filter((episode) => Boolean(episode.videoUrl?.trim()))
      .map((episode) => ({
        serial: { ...toCardData(serial), backdropUrl: serial.backdropUrl },
        episode: { id: episode.id, season: episode.season, episode: episode.episode, title: episode.title, previewUrl: episode.previewUrl, duration: episode.duration, viewCount: episode.viewCount, createdAt: episode.createdAt, updatedAt: episode.updatedAt },
        addedAt: episodeTimestamp(serial, episode),
      })))
    .sort(compareLatestEpisodes)
    .slice(0, limit);
}

export async function getLatestEpisodes(limit = 24): Promise<LatestEpisode[]> {
  return getLatestEpisodesFromMovies(await getPublishedMovies(), limit);
}

/**
 * Bosh sahifa uchun: avval har serialning eng yangi 2 qismi tanlanadi,
 * keyin seriallar eng so'nggi qismi va ichidagi qismlar bo'yicha saralanadi.
 */
function getDiverseLatestEpisodes(movies: Movie[], limit: number): LatestEpisode[] {
  const episodesBySerial = new Map<string, LatestEpisode[]>();

  for (const item of getLatestEpisodesFromMovies(movies, Number.MAX_SAFE_INTEGER)) {
    const items = episodesBySerial.get(item.serial.id) ?? [];
    items.push(item);
    episodesBySerial.set(item.serial.id, items);
  }

  return [...episodesBySerial.values()]
    .map((episodes) => episodes.sort(compareLatestEpisodes).slice(0, 2))
    .sort((a, b) => compareLatestEpisodes(a[0], b[0]))
    .flat()
    .slice(0, limit);
}

/**
 * Bosh sahifa uchun alohida, chegaralangan va yengil payload.
 * To'liq Movie JSON (qismlar, video URL, tavsif) client komponentlarga uzatilmaydi.
 */
export const getHomePageData = cache(async (): Promise<HomePageData> => {
  const all = await loadAll();
  const published = all.filter((movie) => movie.status === "PUBLISHED" && !movie.isComingSoon);
  const byNewest = (a: Movie, b: Movie) => timestampValue(b.publishedAt ?? b.createdAt ?? "") - timestampValue(a.publishedAt ?? a.createdAt ?? "");
  const byRank = (a: Movie, b: Movie) => (b.viewCount ?? 0) - (a.viewCount ?? 0) || (b.imdbRating ?? 0) - (a.imdbRating ?? 0);
  const mostViewed = [...published]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 10)
    .map(toCardData);

  return {
    // Carousel dastlabki renderda faqat bir nechta slayd ma'lumotini oladi.
    featured: published.filter((m) => m.isFeatured).slice(0, 5).map(toHeroData),
    mostViewed,
    trending: published.filter((m) => m.isTrending).slice(0, 10).map(toCardData),
    serials: published.filter((m) => m.type === "SERIAL").sort(byNewest).slice(0, 10).map(toCardData),
    newest: published.filter((m) => m.type === "MOVIE").sort(byNewest).slice(0, 12).map(toCardData),
    topMovies: published.filter((m) => m.type === "MOVIE").sort(byRank).slice(0, 5).map(toCardData),
    topSerials: published.filter((m) => m.type === "SERIAL").sort(byRank).slice(0, 5).map(toCardData),
    comingSoon: all.filter((m) => m.isComingSoon && m.status !== "ARCHIVED").sort(byNewest).slice(0, 12).map(toCardData),
    latestEpisodes: getDiverseLatestEpisodes(published, 16),
  };
});
