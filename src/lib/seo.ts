import type { Metadata } from "next";
import type { Episode, Movie } from "@/types/movie";
import { SITE_URL, APP_NAME, SITE_LOCALE } from "@/lib/constants";

/** Kino yoki serial sahifasi uchun to'liq metadata (OG, Twitter, canonical). */
export function buildMovieMetadata(movie: Movie): Metadata {
  const path = `/${movie.type === "SERIAL" ? "serial" : "kino"}/${movie.slug}`;
  const url = `${SITE_URL}${path}`;
  const title = movie.seoTitle || `${movie.title} O'zbek tilida${movie.year ? ` (${movie.year})` : ""}`;
  const description = movie.seoDescription || movie.shortDesc || movie.description || `${movie.title}ni O'zbek tilida onlayn tomosha qiling.`;
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

/** AI javob bermagan holatda ham har bir material uchun o'zbekcha SEO tayyorlaydi. */
export function createAutomaticSeo(movie: Pick<Movie, "title" | "year" | "type" | "shortDesc" | "description">) {
  const kind = movie.type === "SERIAL" ? "serialini" : "kinosini";
  const title = `${movie.title} O'zbek tilida${movie.year ? ` (${movie.year})` : ""}`;
  const intro = `${movie.title}${movie.year ? ` (${movie.year})` : ""} ${kind}ni O'zbek tilida onlayn tomosha qiling.`;
  const extra = movie.shortDesc || movie.description;
  return {
    seoTitle: title,
    seoDescription: extra ? `${intro} ${extra}`.slice(0, 160) : intro,
  };
}

/** Serial qismi uchun Telegram, Google va Yandex ulashuv metadata-si. */
export function buildEpisodeMetadata(serial: Movie, episode: Episode): Metadata {
  const path = `/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`;
  const url = `${SITE_URL}${path}`;
  const title = `${serial.title} ${episode.episode}-qism O'zbek tilida${serial.year ? ` (${serial.year})` : ""}`;
  const description = episode.description || `${serial.title} ${episode.episode}-qismini O'zbek tilida onlayn tomosha qiling.`;
  const images = serial.backdropUrl || serial.posterUrl ? [{ url: serial.backdropUrl ?? serial.posterUrl! }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "video.episode", locale: SITE_LOCALE, url, siteName: APP_NAME, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: images?.map((image) => image.url) },
  };
}

/** Serial qismi uchun schema.org TVEpisode tuzilmasi. */
export function buildEpisodeJsonLd(serial: Movie, episode: Episode): Record<string, unknown> {
  const path = `/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`;
  return {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    name: `${serial.title} ${episode.episode}-qism O'zbek tilida`,
    description: episode.description || `${serial.title} ${episode.episode}-qismini O'zbek tilida tomosha qiling.`,
    url: `${SITE_URL}${path}`,
    episodeNumber: episode.episode,
    partOfSeason: { "@type": "TVSeason", seasonNumber: episode.season },
    partOfSeries: { "@type": "TVSeries", name: serial.title, url: `${SITE_URL}/serial/${serial.slug}` },
    image: serial.posterUrl || serial.backdropUrl,
    inLanguage: "uz",
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
