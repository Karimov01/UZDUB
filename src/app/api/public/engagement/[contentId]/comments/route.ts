import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createComment } from "@/lib/engagement-store";

const attempts = new Map<string, number>();
export async function POST(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.id === "admin") return NextResponse.json({ error: "Izoh yozish uchun Telegram orqali kiring." }, { status: 401 });
  const { contentId } = await params;
  const body = await request.json().catch(() => null) as { text?: string; parentId?: string } | null;
  const text = body?.text?.trim().replace(/\s+/g, " ") ?? "";
  if (text.length < 2 || text.length > 800) return NextResponse.json({ error: "Izoh 2–800 belgi oralig‘ida bo‘lishi kerak." }, { status: 400 });
  const key = `${contentId}:${session.user.id}`;
  if (Date.now() - (attempts.get(key) ?? 0) < 10_000) return NextResponse.json({ error: "Yangi izohdan oldin biroz kuting." }, { status: 429 });
  attempts.set(key, Date.now());
  await createComment(randomUUID(), contentId, session.user.id, text, typeof body?.parentId === "string" ? body.parentId : undefined);
  return NextResponse.json({ ok: true });
}
