import type { ContentType, Movie } from "@/types/movie";

const TYPES = new Set<ContentType>(["MOVIE", "SERIAL", "CARTOON"]);
const SORTS = new Set(["newest", "popular", "rating", "views", "title"]);
export type SearchInput = { q: string; type?: ContentType; genres: string[]; country?: string; from?: number; to?: number; rating?: number; language?: string; dubbing?: string; sort: "newest" | "popular" | "rating" | "views" | "title"; page: number; size: number };
export const normalizeSearch = (value: string) => value.toLocaleLowerCase("uz-UZ").replace(/[’ʻʼ`]/g, "'").replace(/\s+/g, " ").trim();

export function parseSearchParams(params: URLSearchParams): SearchInput {
  const number = (key: string, min: number, max: number) => { const value = Number(params.get(key)); return Number.isFinite(value) && value >= min && value <= max ? value : undefined; };
  const rawType = params.get("type") ?? ""; const rawSort = params.get("sort") ?? "newest";
  return { q: String(params.get("q") ?? "").slice(0, 120), type: TYPES.has(rawType as ContentType) ? rawType as ContentType : undefined, genres: (params.get("genre") ?? "").split(",").map(normalizeSearch).filter(Boolean).slice(0, 8), country: params.get("country")?.slice(0, 80), from: number("from", 1888, 2100), to: number("to", 1888, 2100), rating: number("rating", 0, 10), language: params.get("language")?.slice(0, 80), dubbing: params.get("dubbing")?.slice(0, 80), sort: SORTS.has(rawSort) ? rawSort as SearchInput["sort"] : "newest", page: number("page", 1, 10_000) ?? 1, size: number("size", 8, 24) ?? 16 };
}

export function searchMovies(movies: Movie[], input: SearchInput) {
  const q = normalizeSearch(input.q);
  const match = (value?: string) => normalizeSearch(value ?? "").includes(q);
  const filtered = movies.filter((movie) => {
    if (input.type && movie.type !== input.type) return false;
    if (q && ![movie.title, movie.originalTitle, movie.description, movie.shortDesc].some(match)) return false;
    if (input.genres.length && !input.genres.every((genre) => movie.genres?.some((item) => normalizeSearch(item.slug) === genre || normalizeSearch(item.name) === genre))) return false;
    if (input.country && normalizeSearch(movie.country) !== normalizeSearch(input.country ?? "")) return false;
    if (input.language && normalizeSearch(movie.language) !== normalizeSearch(input.language ?? "")) return false;
    if (input.dubbing && normalizeSearch(movie.dubbing) !== normalizeSearch(input.dubbing ?? "")) return false;
    if (input.from && (movie.year ?? 0) < input.from) return false;
    if (input.to && (movie.year ?? 9999) > input.to) return false;
    return !(input.rating && (movie.imdbRating ?? 0) < input.rating);
  });
  filtered.sort((a, b) => input.sort === "title" ? a.title.localeCompare(b.title, "uz") : input.sort === "rating" ? (b.imdbRating ?? 0) - (a.imdbRating ?? 0) : input.sort === "views" || input.sort === "popular" ? (b.viewCount ?? 0) - (a.viewCount ?? 0) : String(b.createdAt ?? b.publishedAt ?? "").localeCompare(String(a.createdAt ?? a.publishedAt ?? "")));
  const total = filtered.length; const start = (input.page - 1) * input.size;
  return { movies: filtered.slice(start, start + input.size), total, page: input.page, size: input.size, pages: Math.max(1, Math.ceil(total / input.size)) };
}
