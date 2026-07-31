import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveRating, saveReaction } from "@/lib/engagement-store";

const attempts = new Map<string, number>();

export async function POST(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Baho berish uchun avval tizimga kiring." }, { status: 401 });
  const voterId = `user:${session.user.id}`;
  const key = `${contentId}:${voterId}`;
  if (Date.now() - (attempts.get(key) ?? 0) < 700) return NextResponse.json({ error: "Biroz kuting." }, { status: 429 });
  attempts.set(key, Date.now());
  const body = await request.json().catch(() => null) as { score?: number; reaction?: string } | null;
  let saved = false;
  if (typeof body?.score === "number" && Number.isInteger(body.score) && body.score >= 1 && body.score <= 10) saved = await saveRating(contentId, voterId, body.score);
  else if (body?.reaction === "LIKE" || body?.reaction === "DISLIKE") saved = await saveReaction(contentId, voterId, body.reaction);
  else return NextResponse.json({ error: "Noto‘g‘ri ovoz." }, { status: 400 });
  if (!saved) return NextResponse.json({ error: "Siz bu ovozni avval bergansiz. Uni o'zgartirib bo'lmaydi." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
