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

function toCardData(movie: Movie): MovieCardData {
  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    posterUrl: movie.posterUrl,
    type: movie.type,
    year: movie.year,
    duration: movie.duration,
    imdbRating: movie.imdbRating,
    viewCount: movie.viewCount,
    isTrending: movie.isTrending,
    isPremium: movie.isPremium,
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
  latestEpisodes: LatestEpisode[];
}

export interface LatestEpisode {
  serial: MovieCardData;
  episode: Pick<Episode, "id" | "season" | "episode" | "title" | "duration" | "viewCount" | "createdAt" | "updatedAt">;
  addedAt: string;
}

function episodeTimestamp(serial: Movie, episode: Episode): string {
  return episode.createdAt ?? episode.updatedAt ?? episode.airDate ?? serial.updatedAt ?? serial.createdAt ?? "1970-01-01T00:00:00.000Z";
}

/** Faqat tomosha havolasi berilgan serial qismlarini yangi qo'shilganidan saralaydi. */
export function getLatestEpisodesFromMovies(movies: Movie[], limit = 24): LatestEpisode[] {
  return movies
    .filter((movie) => movie.type === "SERIAL")
    .flatMap((serial) => (serial.episodes ?? [])
      .filter((episode) => Boolean(episode.videoUrl?.trim()))
      .map((episode) => ({
        serial: toCardData(serial),
        episode: { id: episode.id, season: episode.season, episode: episode.episode, title: episode.title, duration: episode.duration, viewCount: episode.viewCount, createdAt: episode.createdAt, updatedAt: episode.updatedAt },
        addedAt: episodeTimestamp(serial, episode),
      })))
    .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt))
    .slice(0, limit);
}

export async function getLatestEpisodes(limit = 24): Promise<LatestEpisode[]> {
  return getLatestEpisodesFromMovies(await getPublishedMovies(), limit);
}

/**
 * Bosh sahifa uchun alohida, chegaralangan va yengil payload.
 * To'liq Movie JSON (qismlar, video URL, tavsif) client komponentlarga uzatilmaydi.
 */
export const getHomePageData = cache(async (): Promise<HomePageData> => {
  const published = await getPublishedMovies();
  const mostViewed = [...published]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 10)
    .map(toCardData);

  return {
    // Carousel dastlabki renderda faqat bir nechta slayd ma'lumotini oladi.
    featured: published.filter((m) => m.isFeatured).slice(0, 5).map(toHeroData),
    mostViewed,
    trending: published.filter((m) => m.isTrending).slice(0, 10).map(toCardData),
    serials: published.filter((m) => m.type === "SERIAL").slice(0, 10).map(toCardData),
    newest: published.slice(0, 10).map(toCardData),
    latestEpisodes: getLatestEpisodesFromMovies(published, 10),
  };
});
