import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { DEMO_MOVIES } from "@/lib/demo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
    new Set(DEMO_MOVIES.flatMap((m) => m.genres?.map((g) => g.slug) ?? []))
  );
  const genreRoutes: MetadataRoute.Sitemap = genreSlugs.map((slug) => ({
    url: `${SITE_URL}/janr/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Har bir kino/serial sahifasi
  const contentRoutes: MetadataRoute.Sitemap = DEMO_MOVIES.filter(
    (m) => m.status === "PUBLISHED"
  ).map((m) => ({
    url: `${SITE_URL}/${m.type === "SERIAL" ? "serial" : "kino"}/${m.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...genreRoutes, ...contentRoutes];
}
