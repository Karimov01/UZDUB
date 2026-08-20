import { NextResponse } from "next/server";
import { fillEpisodeMetadata } from "@/lib/ai-episode-fill";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 }); }
  const serialTitle = typeof raw.serialTitle === "string" ? raw.serialTitle.trim().slice(0, 200) : "";
  const originalTitle = typeof raw.originalTitle === "string" ? raw.originalTitle.trim().slice(0, 200) : "";
  if (!serialTitle && !originalTitle) return NextResponse.json({ error: "Serial nomi kerak" }, { status: 400 });
  try {
    const data = await fillEpisodeMetadata({
      serialTitle, originalTitle,
      title: typeof raw.title === "string" ? raw.title : "",
      season: Math.max(1, Number(raw.season) || 1), episode: Math.max(1, Number(raw.episode) || 1),
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI xatosi" }, { status: 502 });
  }
}
