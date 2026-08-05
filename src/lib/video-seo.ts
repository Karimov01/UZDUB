import type { Episode, Movie } from "@/types/movie";
import { SITE_URL } from "@/lib/constants";

type VideoData = {
  name: string;
  description: string;
  thumbnailUrl: string;
  embedUrl: string;
  uploadDate: string;
  duration?: number;
  contentUrl?: string;
};

function validDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function isPublicDirectVideoUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (!/\.(m3u8|mp4|webm|mov)$/i.test(url.pathname)) return false;
    return !["token", "signature", "sig", "expires", "expiry", "policy", "key"].some((key) => url.searchParams.has(key));
  } catch {
    return false;
  }
}

export function durationToIso(minutes?: number) {
  if (!minutes || !Number.isFinite(minutes) || minutes <= 0) return undefined;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `PT${hours ? `${hours}H` : ""}${remainingMinutes ? `${remainingMinutes}M` : ""}`;
}

function thumbnail(movie: Movie) {
  const value = movie.posterUrl || movie.backdropUrl;
  return value?.startsWith("https://") ? value : undefined;
}

function moviePublishDate(movie: Movie) {
  return validDate(movie.publishedAt) || validDate(movie.createdAt) || validDate(movie.updatedAt);
}

function episodePublishDate(serial: Movie, episode: Episode) {
  return validDate(episode.airDate) || moviePublishDate(serial);
}

export function movieWatchPath(movie: Movie) {
  return `/kino/${movie.slug}/tomosha`;
}

export function episodePath(serial: Movie, episode: Episode) {
  return `/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`;
}

export function getMovieVideoData(movie: Movie): VideoData | undefined {
  const poster = thumbnail(movie);
  const uploadDate = moviePublishDate(movie);
  if (!movie.videoUrl || !poster || !uploadDate) return undefined;
  return {
    name: `${movie.title} O'zbek tilida`,
    description: `${movie.title}${movie.year ? ` (${movie.year})` : ""} filmini O'zbek tilida HD sifatda onlayn tomosha qiling.`,
    thumbnailUrl: poster,
    embedUrl: `${SITE_URL}${movieWatchPath(movie)}`,
    uploadDate,
    duration: movie.duration,
    ...(isPublicDirectVideoUrl(movie.videoUrl) ? { contentUrl: movie.videoUrl } : {}),
  };
}

export function getEpisodeVideoData(serial: Movie, episode: Episode): VideoData | undefined {
  const videoUrl = episode.videoUrl || serial.videoUrl;
  const poster = thumbnail(serial);
  const uploadDate = episodePublishDate(serial, episode);
  if (!videoUrl || !poster || !uploadDate) return undefined;
  const label = episode.season === 1 ? `${episode.episode}-qism` : `${episode.season}-fasl ${episode.episode}-qism`;
  return {
    name: `${serial.title} ${label} O'zbek tilida`,
    description: episode.description || `${serial.title} serialining ${label}ini O'zbek tilida HD sifatda onlayn tomosha qiling.`,
    thumbnailUrl: poster,
    embedUrl: `${SITE_URL}${episodePath(serial, episode)}`,
    uploadDate,
    duration: episode.duration || serial.duration,
    ...(isPublicDirectVideoUrl(videoUrl) ? { contentUrl: videoUrl } : {}),
  };
}

export function buildVideoObject(data: VideoData): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: data.name,
    description: data.description,
    thumbnailUrl: [data.thumbnailUrl],
    uploadDate: data.uploadDate,
    embedUrl: data.embedUrl,
    inLanguage: "uz",
    isFamilyFriendly: true,
    ...(durationToIso(data.duration) ? { duration: durationToIso(data.duration) } : {}),
    ...(data.contentUrl ? { contentUrl: data.contentUrl } : {}),
  };
}
