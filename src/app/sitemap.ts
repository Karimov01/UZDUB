import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getComingSoon, getPublishedMovies } from "@/lib/movies";
import { episodePath, getEpisodeVideoData, getMovieVideoData, movieWatchPath } from "@/lib/video-seo";

// Sitemap nashr qilingan kontent bilan har doim birga yangilanishi kerak.
// Statik build vaqtida hosil qilinganda Neon bazasiga keyin qo'shilgan kinolar
// XML ro'yxatiga kirmay qolardi.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [movies, comingSoon] = await Promise.all([getPublishedMovies(), getComingSoon()]);
  const publicComingSoon = comingSoon.filter((movie) => movie.status === "PUBLISHED");
  const lastModified = (movie: (typeof movies)[number]) => {
    const value = movie.updatedAt ?? movie.publishedAt ?? movie.createdAt;
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  // Statik sahifalar
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/kino`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/serial`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/top`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/janr`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/tez-kunda`, changeFrequency: "daily", priority: 0.8 },
  ];

  // Janr sahifalari (kontentdan noyob slug'lar)
  const genreSlugs = Array.from(
    new Set(movies.flatMap((m) => m.genres?.map((g) => g.slug) ?? []))
  );
  const genreRoutes: MetadataRoute.Sitemap = genreSlugs.map((slug) => ({
    url: `${SITE_URL}/janr/${slug}`,
    lastModified: movies.filter((movie) => movie.genres?.some((genre) => genre.slug === slug)).map(lastModified).filter((date): date is Date => Boolean(date)).sort((a,b)=>b.getTime()-a.getTime())[0],
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Har bir kino/serial sahifasi
  const contentRoutes: MetadataRoute.Sitemap = [...movies, ...publicComingSoon].map((m) => ({
    url: `${SITE_URL}/${m.type === "SERIAL" ? "serial" : "kino"}/${m.slug}`,
    lastModified: lastModified(m),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const watchRoutes: MetadataRoute.Sitemap = movies.flatMap((movie) =>
    movie.type !== "SERIAL" && getMovieVideoData(movie)
      ? [{ url: `${SITE_URL}${movieWatchPath(movie)}`, lastModified: lastModified(movie), changeFrequency: "weekly" as const, priority: 0.7 }]
      : []
  );

  // Har bir serial qismi ham mustaqil SEO manziliga ega.
  const episodeRoutes: MetadataRoute.Sitemap = movies.flatMap((serial) =>
    serial.type === "SERIAL"
      ? (serial.episodes ?? []).flatMap((episode) => getEpisodeVideoData(serial, episode) ? [{
          url: `${SITE_URL}${episodePath(serial, episode)}`,
          lastModified: episode.airDate ? new Date(episode.airDate) : lastModified(serial),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }] : [])
      : []
  );

  return [...staticRoutes, ...genreRoutes, ...contentRoutes, ...watchRoutes, ...episodeRoutes];
}
