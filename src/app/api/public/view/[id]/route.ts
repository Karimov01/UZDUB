import { NextResponse } from "next/server";
import { incrementView } from "@/lib/movies-store";

export const runtime = "nodejs";

// Ochiq (auth'siz) — kino ochilganda ko'rishlar sonini +1
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const count = await incrementView(id);
    return NextResponse.json({ ok: true, count });
  } catch {
    // Demo kinolar bazada yo'q — jimgina o'tkazamiz
    return NextResponse.json({ ok: false, count: null });
  }
}
