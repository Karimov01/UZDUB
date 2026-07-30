import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getPublishedMovies } from "@/lib/movies";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const movies = await getPublishedMovies();
  const lastModified = (movie: (typeof movies)[number]) => new Date(movie.publishedAt ?? movie.createdAt ?? `${movie.year ?? 2025}-01-01`);

  // Statik sahifalar
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date("2025-01-01"), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/kino`, lastModified: new Date("2025-01-01"), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/serial`, lastModified: new Date("2025-01-01"), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/top`, lastModified: new Date("2025-01-01"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/janr`, lastModified: new Date("2025-01-01"), changeFrequency: "weekly", priority: 0.7 },
  ];

  // Janr sahifalari (kontentdan noyob slug'lar)
  const genreSlugs = Array.from(
    new Set(movies.flatMap((m) => m.genres?.map((g) => g.slug) ?? []))
  );
  const genreRoutes: MetadataRoute.Sitemap = genreSlugs.map((slug) => ({
    url: `${SITE_URL}/janr/${slug}`,
    lastModified: movies.filter((movie) => movie.genres?.some((genre) => genre.slug === slug)).map(lastModified).sort((a,b)=>b.getTime()-a.getTime())[0],
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Har bir kino/serial sahifasi
  const contentRoutes: MetadataRoute.Sitemap = movies.map((m) => ({
    url: `${SITE_URL}/${m.type === "SERIAL" ? "serial" : "kino"}/${m.slug}`,
    lastModified: lastModified(m),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Har bir serial qismi ham mustaqil SEO manziliga ega.
  const episodeRoutes: MetadataRoute.Sitemap = movies.flatMap((serial) =>
    serial.type === "SERIAL"
      ? (serial.episodes ?? []).map((episode) => ({
          url: `${SITE_URL}/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`,
        lastModified: new Date(episode.airDate ?? serial.publishedAt ?? serial.createdAt ?? `${serial.year ?? 2025}-01-01`),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      : []
  );

  return [...staticRoutes, ...genreRoutes, ...contentRoutes, ...episodeRoutes];
}
