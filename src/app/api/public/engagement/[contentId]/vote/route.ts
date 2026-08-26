import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveRating, saveReaction } from "@/lib/engagement-store";

const attempts = new Map<string, number>();
export async function POST(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  const jar = await cookies();
  const guestId = jar.get("guest_voter_id")?.value ?? randomUUID();
  const voterId = session?.user?.id && session.user.id !== "admin" ? `user:${session.user.id}` : `guest:${createHash("sha256").update(guestId).digest("hex")}`;
  const key = `${contentId}:${voterId}`;
  if (Date.now() - (attempts.get(key) ?? 0) < 700) return NextResponse.json({ error: "Biroz kuting." }, { status: 429 });
  attempts.set(key, Date.now());
  const body = await request.json().catch(() => null) as { score?: number; reaction?: string } | null;
  let saved = false;
  if (typeof body?.score === "number" && Number.isInteger(body.score) && body.score >= 1 && body.score <= 10) saved = await saveRating(contentId, voterId, body.score);
  else if (body?.reaction === "LIKE" || body?.reaction === "DISLIKE") saved = await saveReaction(contentId, voterId, body.reaction);
  else return NextResponse.json({ error: "Noto'g'ri ovoz." }, { status: 400 });
  if (!saved) return NextResponse.json({ error: "Siz bu ovozni avval bergansiz." }, { status: 409 });
  const response = NextResponse.json({ ok: true });
  if (!jar.get("guest_voter_id")) response.cookies.set("guest_voter_id", guestId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
