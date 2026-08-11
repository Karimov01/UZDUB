import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { ContentType, Movie } from "@/types/movie";
import { AiOfficeDraftInput, payloadHash, validBearer } from "@/lib/ai-office-contract";
import { addMovie, claimAiOfficeRequest, completeAiOfficeRequest, failAiOfficeRequest, getMovieBySlug, slugExists, updateMovie } from "@/lib/movies-store";
import { mapGenres, slugify } from "@/lib/movie-input";
import { createAutomaticSeo } from "@/lib/seo";
import { fillMovieMetadata } from "@/lib/ai-movie-fill";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  if (!validBearer(request.headers.get("authorization"), process.env.UZDUB_AI_OFFICE_API_KEY)) return json({ error: "UNAUTHORIZED" }, 401);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[A-Za-z0-9:_-]{8,200}$/.test(idempotencyKey)) return json({ error: "INVALID_IDEMPOTENCY_KEY" }, 400);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ error: "PAYLOAD_TOO_LARGE" }, 413);
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return json({ error: "PAYLOAD_TOO_LARGE" }, 413);
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return json({ error: "INVALID_JSON" }, 400); }
  const parsed = AiOfficeDraftInput.safeParse(raw);
  if (!parsed.success) return json({ error: "VALIDATION_ERROR", issues: parsed.error.issues.map(({ path, message }) => ({ path, message })) }, 400);
  const hash = payloadHash(parsed.data);
  const claim = await claimAiOfficeRequest(idempotencyKey, hash);
  if (claim.status === "CONFLICT") return json({ error: "IDEMPOTENCY_CONFLICT" }, 409);
  if (claim.status === "IN_PROGRESS") return json({ error: "REQUEST_IN_PROGRESS" }, 409);
  if (claim.status === "REUSED") return NextResponse.json(claim.result, { headers: responseHeaders() });
  try {
    const result = parsed.data.contentType === "EPISODE" ? await createEpisodeDraft(parsed.data) : await createTitleDraft(parsed.data);
    await completeAiOfficeRequest(idempotencyKey, result);
    return NextResponse.json(result, { status: 201, headers: responseHeaders() });
  } catch (error) {
    await failAiOfficeRequest(idempotencyKey, error instanceof Error ? error.name : "UnknownError").catch(() => undefined);
    if (error instanceof ApiError) return json({ error: error.code }, error.status);
    return json({ error: "DRAFT_CREATE_FAILED" }, 500);
  }
}

async function createTitleDraft(input: Extract<typeof AiOfficeDraftInput._output, { contentType: "MOVIE" | "SERIES" }>) {
  const base = slugify(input.title) || slugify(input.originalTitle ?? "") || `kontent-${Date.now()}`;
  let slug = base, suffix = 2;
  while (await slugExists(slug)) slug = `${base}-${suffix++}`;
  const id = randomUUID(), type: ContentType = input.contentType === "SERIES" ? "SERIAL" : "MOVIE";
  let filled; try { filled = await fillMovieMetadata({ title: input.title, originalTitle: input.originalTitle, year: input.year, type }); } catch { throw new ApiError("AI_ENRICHMENT_FAILED", 502); }
  const description = filled.description || input.description, shortDesc = filled.shortDesc || input.shortDescription;
  const seo = createAutomaticSeo({ title: input.title, year: input.year, type, shortDesc, description });
  const movie: Movie = { id, slug, title: input.title, originalTitle: input.originalTitle, description, shortDesc, posterUrl: filled.posterUrl ?? input.posterUrl, backdropUrl: filled.backdropUrl ?? input.backdropUrl, videoUrl: input.playerUrl, trailerUrl: input.trailerUrl, type, status: "DRAFT", year: input.year, duration: filled.duration ?? input.duration, country: filled.country || input.country, language: filled.language || input.language, dubbing: filled.dubbing, imdbRating: filled.imdbRating, viewCount: 0, isFeatured: input.isFeatured, isTrending: input.isTrending, isPremium: input.isPremium, genres: mapGenres(filled.genres.length ? filled.genres : input.genres), episodes: [], ...seo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await addMovie(movie);
  revalidatePath(type === "SERIAL" ? "/serial" : "/kino");
  return { id, status: "DRAFT" as const, url: `https://uzdub.com/${type === "SERIAL" ? "serial" : "kino"}/${slug}`, metadataEnriched: true, approvalRequired: true, publishPath: `/api/ai-office/drafts/${id}/publish` };
}

async function createEpisodeDraft(input: Extract<typeof AiOfficeDraftInput._output, { contentType: "EPISODE" }>) {
  const parent = await getMovieBySlug(input.parentSlug);
  if (!parent || parent.type !== "SERIAL") throw new ApiError("PARENT_SERIES_NOT_FOUND", 404);
  if (parent.episodes?.some((item) => item.season === input.season && item.episode === input.episode)) throw new ApiError("EPISODE_ALREADY_EXISTS", 409);
  const id = randomUUID(), now = new Date().toISOString();
  const updated: Movie = { ...parent, status: "DRAFT", episodes: [...(parent.episodes ?? []), { id, movieId: parent.id, season: input.season, episode: input.episode, title: input.title, description: input.description, videoUrl: input.playerUrl, duration: input.duration, viewCount: 0, createdAt: now, updatedAt: now }], updatedAt: now };
  await updateMovie(parent.id, updated);
  revalidatePath(`/serial/${parent.slug}`);
  return { id: `${parent.id}:${id}`, status: "DRAFT" as const, url: `https://uzdub.com/serial/${parent.slug}/qism/${input.season}/${input.episode}` };
}

function json(body: unknown, status: number) { return NextResponse.json(body, { status, headers: responseHeaders() }); }
function responseHeaders() { return { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }; }
class ApiError extends Error { constructor(readonly code: string, readonly status: number) { super(code); } }
