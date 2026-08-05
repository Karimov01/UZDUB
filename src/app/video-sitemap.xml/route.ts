import { getPublishedMovies } from "@/lib/movies";
import { getEpisodeVideoData, getMovieVideoData } from "@/lib/video-seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  const movies = await getPublishedMovies();
  const entries = [
    ...movies.filter((movie) => movie.type !== "SERIAL").flatMap((movie) => {
      const video = getMovieVideoData(movie);
      return video ? [{ pageUrl: video.embedUrl, video }] : [];
    }),
    ...movies.filter((movie) => movie.type === "SERIAL").flatMap((serial) =>
      (serial.episodes ?? []).flatMap((episode) => {
        const video = getEpisodeVideoData(serial, episode);
        return video ? [{ pageUrl: video.embedUrl, video }] : [];
      })
    ),
  ];

  const urls = entries.map(({ pageUrl, video }) => {
    const source = video.contentUrl
      ? `<video:content_loc>${escapeXml(video.contentUrl)}</video:content_loc>`
      : `<video:player_loc allow_embed="yes">${escapeXml(video.embedUrl)}</video:player_loc>`;
    const duration = video.duration && video.duration > 0 ? `<video:duration>${Math.round(video.duration * 60)}</video:duration>` : "";
    return `<url><loc>${escapeXml(pageUrl)}</loc><video:video><video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc><video:title>${escapeXml(video.name)}</video:title><video:description>${escapeXml(video.description)}</video:description>${source}${duration}<video:publication_date>${escapeXml(video.uploadDate)}</video:publication_date></video:video></url>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } });
}
