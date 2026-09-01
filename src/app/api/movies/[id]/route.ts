import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Movie, ContentType, ContentStatus } from "@/types/movie";
import { getMovie, updateMovie, deleteMovie } from "@/lib/movies-store";
import { MovieInput, mapGenres, mapEpisodes } from "@/lib/movie-input";
import { createAutomaticSeo } from "@/lib/seo";
import { notifyIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

function publicPaths(movie?: Movie): string[] {
  const common = ["/", "/kino", "/serial", "/top", "/janr", "/yangi-qismlar", "/tez-kunda"];
  if (!movie) return common;
  const contentPath = movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`;
  const episodePaths = movie.type === "SERIAL" ? (movie.episodes ?? []).map((episode) => `/serial/${movie.slug}/qism/${episode.season}/${episode.episode}`) : [];
  return [...common, contentPath, ...episodePaths];
}

function revalidateMovie(movie?: Movie) {
  for (const path of publicPaths(movie)) revalidatePath(path);
  revalidatePath("/janr/[slug]", "page");
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const existing = await getMovie(id);
  let ok = false;
  try { ok = await deleteMovie(id); } catch (err) { const msg = err instanceof Error ? err.message : ""; return NextResponse.json({ error: `Bazaga ulanib bo'lmadi. ${msg}`.trim() }, { status: 500 }); }
  if (!ok) return NextResponse.json({ error: "Bu kino bazada yo'q (namuna kinolarni o'chirib bo'lmaydi)" }, { status: 404 });
  revalidateMovie(existing);
  if (existing) void notifyIndexNow([`/${existing.type === "SERIAL" ? "serial" : "kino"}/${existing.slug}`]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const existing = await getMovie(id);
  if (!existing) return NextResponse.json({ error: "Bu kino bazada yo'q (namuna kinoni tahrirlab bo'lmaydi)" }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 }); }
  const parsed = MovieInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" }, { status: 400 });
  const d = parsed.data;
  const seo = createAutomaticSeo({ title: d.title, year: d.year, type: d.type as ContentType, shortDesc: d.shortDesc, description: d.description });
  const now = new Date().toISOString();
  const isNewPublication = d.status === "PUBLISHED" && !d.isComingSoon && (existing.status !== "PUBLISHED" || existing.isComingSoon);
  const updated: Movie = { ...existing, id, slug: existing.slug, title: d.title, originalTitle: d.originalTitle || undefined, description: d.description, shortDesc: d.shortDesc || undefined, posterUrl: d.posterUrl || undefined, backdropUrl: d.backdropUrl || undefined, videoUrl: d.videoUrl || undefined, trailerUrl: d.trailerUrl || undefined, type: d.type as ContentType, status: d.status as ContentStatus, year: d.year, duration: d.duration, country: d.country || undefined, language: d.language || undefined, dubbing: d.dubbing || undefined, imdbRating: d.imdbRating, isFeatured: d.isFeatured, isTrending: d.isTrending, isPremium: d.isPremium, isComingSoon: d.isComingSoon, isRussian: d.isRussian, isTrailer: d.isTrailer, ...seo, publishedAt: isNewPublication ? now : existing.publishedAt, updatedAt: now, genres: mapGenres(d.genres), episodes: mapEpisodes(d.episodes, id, existing.episodes ?? []) };
  try { await updateMovie(id, updated); } catch (err) { const msg = err instanceof Error ? err.message : ""; return NextResponse.json({ error: `Bazaga saqlab bo'lmadi. ${msg}`.trim() }, { status: 500 }); }
  revalidateMovie(existing);
  revalidateMovie(updated);
  void notifyIndexNow([`/${updated.type === "SERIAL" ? "serial" : "kino"}/${updated.slug}`, ...(updated.type === "SERIAL" ? (updated.episodes ?? []).map((episode) => `/serial/${updated.slug}/qism/${episode.season}/${episode.episode}`) : [])]);
  return NextResponse.json({ ok: true, movie: updated });
}
