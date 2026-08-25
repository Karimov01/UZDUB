import type { Movie } from "@/types/movie";

export type RecommendationReason = "same_genre" | "same_country" | "same_cast" | "similar_rating" | "popular";
export type Recommendation = { movie: Movie; score: number; reasons: RecommendationReason[] };

const shared = (left: { id?: string; name?: string }[] | undefined, right: { id?: string; name?: string }[] | undefined) => (left ?? []).filter((item) => (right ?? []).some((other) => (item.id && item.id === other.id) || item.name === other.name)).length;

/** Kontent sahifalari uchun serverda hisoblanadigan barqaror tavsiyalar. */
export function getRecommendations(current: Movie, candidates: Movie[], limit = 12): Recommendation[] {
  const scored = candidates.filter((candidate) => candidate.id !== current.id && candidate.status === "PUBLISHED" && !candidate.isComingSoon && Boolean(candidate.videoUrl || candidate.episodes?.some((episode) => episode.videoUrl))).map((candidate) => {
    let score = candidate.type === current.type ? 40 : 0;
    const reasons: RecommendationReason[] = [];
    const genres = shared(candidate.genres, current.genres);
    if (genres) { score += genres * 20; reasons.push("same_genre"); }
    if (candidate.country && candidate.country === current.country) { score += 12; reasons.push("same_country"); }
    if ((candidate.language && candidate.language === current.language) || (candidate.dubbing && candidate.dubbing === current.dubbing)) score += 8;
    if (candidate.year && current.year && Math.abs(candidate.year - current.year) <= 2) score += 8;
    if (shared(candidate.cast, current.cast) || shared(candidate.directors, current.directors)) { score += 15; reasons.push("same_cast"); }
    if (candidate.imdbRating && current.imdbRating && Math.abs(candidate.imdbRating - current.imdbRating) <= 0.7) { score += 5; reasons.push("similar_rating"); }
    const popularity = Math.min(5, Math.floor((candidate.viewCount ?? 0) / 10_000));
    if (popularity) { score += popularity; reasons.push("popular"); }
    if (candidate.createdAt && Date.now() - new Date(candidate.createdAt).getTime() < 2_592_000_000) score += 3;
    return { movie: candidate, score, reasons };
  });
  const preferred = scored.filter((item) => item.movie.type === current.type && item.score > 40);
  const fallback = scored.filter((item) => !preferred.includes(item) && (item.movie.type === current.type || item.reasons.includes("same_genre")));
  return [...preferred, ...fallback].sort((a, b) => b.score - a.score || (b.movie.viewCount ?? 0) - (a.movie.viewCount ?? 0) || String(b.movie.createdAt ?? "").localeCompare(String(a.movie.createdAt ?? ""))).slice(0, limit);
}
