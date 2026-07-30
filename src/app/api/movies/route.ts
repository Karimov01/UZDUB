import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { Movie, ContentType, ContentStatus } from "@/types/movie";
import { readMovies, addMovie, slugExists } from "@/lib/movies-store";
import { MovieInput, mapGenres, mapEpisodes, slugify } from "@/lib/movie-input";
import { createAutomaticSeo } from "@/lib/seo";
import { notifyIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";

export async function GET() {
  const movies = await readMovies();
  return NextResponse.json({ movies });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const parsed = MovieInput.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const d = parsed.data;

  // Noyob slug yaratish (o'zbekcha nomdan afzal; bo'sh bo'lsa asl nomdan)
  const base = slugify(d.title) || slugify(d.originalTitle) || `kino-${Date.now()}`;
  let slug = base;
  let i = 2;
  while (await slugExists(slug)) {
    slug = `${base}-${i++}`;
  }

  const id = randomUUID();
  const seo = createAutomaticSeo({ title: d.title, year: d.year, type: d.type as ContentType, shortDesc: d.shortDesc, description: d.description });
  const movie: Movie = {
    id,
    slug,
    title: d.title,
    originalTitle: d.originalTitle || undefined,
    description: d.description,
    shortDesc: d.shortDesc || undefined,
    posterUrl: d.posterUrl || undefined,
    backdropUrl: d.backdropUrl || undefined,
    videoUrl: d.videoUrl || undefined,
    trailerUrl: d.trailerUrl || undefined,
    type: d.type as ContentType,
    status: d.status as ContentStatus,
    year: d.year,
    duration: d.duration,
    country: d.country || undefined,
    language: d.language || undefined,
    dubbing: d.dubbing || undefined,
    imdbRating: d.imdbRating,
    viewCount: 0,
    isFeatured: d.isFeatured,
    isTrending: d.isTrending,
    isPremium: d.isPremium,
    ...seo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    genres: mapGenres(d.genres),
    episodes: mapEpisodes(d.episodes, id),
  };

  try {
    await addMovie(movie);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // Ko'pincha DATABASE_URL sozlanmagan yoki noto'g'ri bo'lsa yuz beradi
    return NextResponse.json(
      { error: `Bazaga saqlab bo'lmadi. DATABASE_URL ni tekshiring. ${msg}`.trim() },
      { status: 500 }
    );
  }
  // Ommaviy sahifalar keshini yangilash — yangi kino darhol ko'rinadi
  const path = movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`;
  for (const p of ["/", "/kino", "/serial", "/top", "/janr", path]) {
    revalidatePath(p);
  }
  void notifyIndexNow([path, ...(movie.type === "SERIAL" ? (movie.episodes ?? []).map((episode) => `/serial/${movie.slug}/qism/${episode.season}/${episode.episode}`) : [])]);

  return NextResponse.json({ ok: true, movie });
}
