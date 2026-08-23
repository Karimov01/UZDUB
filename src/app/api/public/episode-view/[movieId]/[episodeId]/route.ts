import { NextResponse } from "next/server";
import { incrementEpisodeView } from "@/lib/movies-store";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ movieId: string; episodeId: string }> };
export async function POST(_request: Request, { params }: Ctx) {
  const { movieId, episodeId } = await params;
  try {
    const counts = await incrementEpisodeView(movieId, episodeId);
    return NextResponse.json({ ok: Boolean(counts), count: counts?.episodeCount ?? null, contentCount: counts?.contentCount ?? null });
  } catch {
    return NextResponse.json({ ok: false, count: null, contentCount: null });
  }
}
