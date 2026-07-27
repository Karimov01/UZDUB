import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getPublishedMovies } from "@/lib/movies";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const movies = await getPublishedMovies();

  // Statik sahifalar
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/kino`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/serial`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/top`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/janr`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Janr sahifalari (kontentdan noyob slug'lar)
  const genreSlugs = Array.from(
    new Set(movies.flatMap((m) => m.genres?.map((g) => g.slug) ?? []))
  );
  const genreRoutes: MetadataRoute.Sitemap = genreSlugs.map((slug) => ({
    url: `${SITE_URL}/janr/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Har bir kino/serial sahifasi
  const contentRoutes: MetadataRoute.Sitemap = movies.map((m) => ({
    url: `${SITE_URL}/${m.type === "SERIAL" ? "serial" : "kino"}/${m.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...genreRoutes, ...contentRoutes];
}
