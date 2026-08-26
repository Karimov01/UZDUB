import type { Movie, MovieCardData } from "@/types/movie";
import { toCardData } from "@/lib/movies";
import { readPublishedCatalog } from "@/lib/movies-store";

export type CatalogSort = "new" | "rating" | "random";

export function parseCatalogSort(value?: string): CatalogSort {
  return value === "rating" || value === "random" ? value : "new";
}

function time(value?: string | null): number {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function sortCatalog(items: Movie[], sort: CatalogSort): MovieCardData[] {
  return [...items]
    .sort((a, b) => {
      if (sort === "rating") {
        return (b.imdbRating ?? 0) - (a.imdbRating ?? 0)
          || time(b.publishedAt ?? b.createdAt) - time(a.publishedAt ?? a.createdAt)
          || a.id.localeCompare(b.id);
      }
      if (sort === "random") {
        return stableHash(a.id) - stableHash(b.id) || a.id.localeCompare(b.id);
      }
      return time(b.publishedAt ?? b.createdAt) - time(a.publishedAt ?? a.createdAt)
        || a.id.localeCompare(b.id);
    })
    .map(toCardData);
}

export function paginateCatalog<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), totalPages };
}

export async function getCatalogPage(kind: "movie" | "serial", sort: CatalogSort, page: number, pageSize: number) {
  const { movies, total } = await readPublishedCatalog(kind === "movie" ? "MOVIE" : "SERIAL", sort, (page - 1) * pageSize, pageSize);
  return { items: movies.map(toCardData), totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
