import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getWatchProgress, saveWatchProgress } from "@/lib/movies-store";

export const runtime = "nodejs";

const ProgressInput = z.object({ movieId: z.string().min(1).max(200), episodeId: z.string().min(1).max(200).optional(), positionSeconds: z.number().finite().min(0).max(86_400), durationSeconds: z.number().finite().min(0).max(86_400), completed: z.boolean().optional().default(false) });

export async function GET(request: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ authenticated: false, progress: null }, { headers: { "Cache-Control": "private, no-store" } });
  const url = new URL(request.url); const movieId = url.searchParams.get("movieId") ?? ""; const episodeId = url.searchParams.get("episodeId") ?? undefined;
  if (!movieId) return NextResponse.json({ error: "movieId majburiy" }, { status: 400 });
  return NextResponse.json({ authenticated: true, progress: await getWatchProgress(userId, movieId, episodeId) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
  const parsed = ProgressInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Progress ma'lumoti noto'g'ri" }, { status: 400 });
  const input = parsed.data;
  const completed = input.completed || (input.durationSeconds > 0 && input.positionSeconds / input.durationSeconds >= 0.97);
  const positionSeconds = completed ? 0 : Math.min(input.positionSeconds, input.durationSeconds || input.positionSeconds);
  return NextResponse.json({ progress: await saveWatchProgress(userId, { ...input, positionSeconds, completed }) }, { headers: { "Cache-Control": "private, no-store" } });
}
