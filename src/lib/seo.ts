import type { Metadata } from "next";
import type { Movie } from "@/types/movie";
import { SITE_URL, APP_NAME, SITE_LOCALE } from "@/lib/constants";

/** Kino yoki serial sahifasi uchun to'liq metadata (OG, Twitter, canonical). */
export function buildMovieMetadata(movie: Movie): Metadata {
  const path = `/${movie.type === "SERIAL" ? "serial" : "kino"}/${movie.slug}`;
  const url = `${SITE_URL}${path}`;
  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ""}`;
  const description = movie.shortDesc ?? movie.description;
  const images = movie.backdropUrl || movie.posterUrl ? [{ url: movie.backdropUrl ?? movie.posterUrl! }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "video.other",
      locale: SITE_LOCALE,
      url,
      siteName: APP_NAME,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

/** schema.org Movie yoki TVSeries tuzilmasi (Google/Yandex rich results). */
export function buildMovieJsonLd(movie: Movie): Record<string, unknown> {
  const path = `/${movie.type === "SERIAL" ? "serial" : "kino"}/${movie.slug}`;
  const type = movie.type === "SERIAL" ? "TVSeries" : "Movie";

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: movie.title,
    alternateName: movie.originalTitle,
    description: movie.shortDesc ?? movie.description,
    url: `${SITE_URL}${path}`,
    image: movie.posterUrl,
    inLanguage: "uz",
    genre: movie.genres?.map((g) => g.name),
    countryOfOrigin: movie.country,
  };

  if (movie.year) data.datePublished = String(movie.year);
  if (movie.type !== "SERIAL" && movie.duration) {
    // ISO 8601 davomiylik, masalan 120 daqiqa -> PT120M
    data.duration = `PT${movie.duration}M`;
  }
  if (movie.imdbRating) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: movie.imdbRating,
      bestRating: 10,
      worstRating: 0,
      ratingCount: movie.viewCount && movie.viewCount > 0 ? movie.viewCount : 1000,
    };
  }
  return data;
}
