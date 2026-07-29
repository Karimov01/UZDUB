import { NextResponse } from "next/server";
import { incrementEpisodeView } from "@/lib/movies-store";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ movieId: string; episodeId: string }> };
export async function POST(_request: Request, { params }: Ctx) { const { movieId, episodeId } = await params; try { return NextResponse.json({ count: await incrementEpisodeView(movieId, episodeId) }); } catch { return NextResponse.json({ count: null }); } }
