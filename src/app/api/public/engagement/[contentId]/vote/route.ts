import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveRating, saveReaction } from "@/lib/engagement-store";

const attempts = new Map<string, number>();

export async function POST(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  const cookie = request.headers.get("cookie")?.match(/(?:^|; )uzdub_voter=([^;]+)/)?.[1];
  const token = cookie || randomUUID();
  const voterId = session?.user?.id ? `user:${session.user.id}` : `guest:${token}`;
  const key = `${contentId}:${voterId}`;
  if (Date.now() - (attempts.get(key) ?? 0) < 700) return NextResponse.json({ error: "Biroz kuting." }, { status: 429 });
  attempts.set(key, Date.now());
  const body = await request.json().catch(() => null) as { score?: number; reaction?: string } | null;
  if (typeof body?.score === "number" && Number.isInteger(body.score) && body.score >= 1 && body.score <= 10) await saveRating(contentId, voterId, body.score);
  else if (body?.reaction === "LIKE" || body?.reaction === "DISLIKE") await saveReaction(contentId, voterId, body.reaction);
  else return NextResponse.json({ error: "Noto‘g‘ri ovoz." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  if (!cookie && !session?.user?.id) response.cookies.set("uzdub_voter", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
