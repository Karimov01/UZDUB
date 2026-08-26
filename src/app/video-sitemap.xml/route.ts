import { getPublishedMovies } from "@/lib/movies";
import { getEpisodeVideoData, getMovieVideoData, isPublicDirectVideoUrl } from "@/lib/video-seo";

export const revalidate = 3600;

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function isCommonTeaser(value: string) {
  try {
    return /(?:^|\/)(?:teaser|trailer)(?:[-_.]?\d+)?\.(?:mp4|m3u8)$/i.test(new URL(value).pathname);
  } catch {
    return true;
  }
}

export async function GET() {
  const movies = await getPublishedMovies();
  const entries = [
    ...movies.filter((movie) => movie.type !== "SERIAL").flatMap((movie) => {
      const video = getMovieVideoData(movie);
      // HTML tomosha sahifasi player_loc emas. Video sitemap faqat Googlebot
      // kira oladigan doimiy MP4/HLS manbaga ega bo'lsa kiritiladi.
      return video?.contentUrl ? [{ pageUrl: video.embedUrl, video }] : [];
    }),
    ...movies.filter((movie) => movie.type === "SERIAL").flatMap((serial) =>
      (serial.episodes ?? []).flatMap((episode) => {
        // Serialning umumiy videoUrl'i (masalan teaser.mp4) qismlarga meros bo'lmaydi.
        // Har bir qism faqat o'zining doimiy MP4/HLS URL'i bilan kiritiladi.
        const episodeVideoUrl = episode.videoUrl;
        if (!episodeVideoUrl || !isPublicDirectVideoUrl(episodeVideoUrl) || episodeVideoUrl === serial.videoUrl || isCommonTeaser(episodeVideoUrl)) return [];
        const video = getEpisodeVideoData(serial, episode);
        return video?.contentUrl ? [{ pageUrl: video.embedUrl, video }] : [];
      })
    ),
  ];

  const urls = entries.map(({ pageUrl, video }) => {
    const durationSeconds = video.duration ? Math.round(video.duration * 60) : 0;
    const duration = durationSeconds >= 1 && durationSeconds <= 28_800 ? `<video:duration>${durationSeconds}</video:duration>` : "";
    // entries ga faqat contentUrl bilan kelgan materiallar qo'shiladi.
    return `<url><loc>${escapeXml(pageUrl)}</loc><video:video><video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc><video:title>${escapeXml(video.name)}</video:title><video:description>${escapeXml(video.description)}</video:description><video:content_loc>${escapeXml(video.contentUrl!)}</video:content_loc>${duration}<video:publication_date>${escapeXml(video.uploadDate)}</video:publication_date></video:video></url>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
