import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { commentExistsInContent, createComment } from "@/lib/engagement-store";

const attempts = new Map<string, number[]>();
const unsafeMarkup = /<\s*\/?\s*(script|iframe|object|embed|style)\b/i;

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((time) => now - time < 60 * 60 * 1000);
  const inMinute = timestamps.filter((time) => now - time < 60 * 1000).length;
  if (inMinute >= 2 || timestamps.length >= 10) return true;
  attempts.set(key, [...timestamps, now]);
  return false;
}

export async function POST(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const session = await auth();
  const { contentId } = await params;
  const body = await request.json().catch(() => null) as { text?: string; name?: string; parentId?: string; website?: string } | null;

  if (body?.website) return NextResponse.json({ error: "Noto'g'ri so'rov." }, { status: 400 });

  const text = normalize(body?.text);
  const name = normalize(body?.name);
  if (text.length < 2 || text.length > 1000) return NextResponse.json({ error: "Izoh 2–1000 belgi oralig'ida bo'lishi kerak." }, { status: 400 });
  if (unsafeMarkup.test(text) || unsafeMarkup.test(name)) return NextResponse.json({ error: "Izohda xavfli HTML teglar ishlatilishi mumkin emas." }, { status: 400 });

  const isAuthenticated = Boolean(session?.user?.id && session.user.id !== "admin");
  if (!isAuthenticated && (name.length < 2 || name.length > 40)) return NextResponse.json({ error: "Ism 2–40 belgi oralig'ida bo'lishi kerak." }, { status: 400 });

  const jar = await cookies();
  const guestId = jar.get("guest_comment_id")?.value ?? randomUUID();
  const guestHash = createHash("sha256").update(guestId).digest("hex");
  const identity = isAuthenticated ? `user:${session?.user?.id}` : `guest:${guestHash}`;
  if (isRateLimited(`${contentId}:${identity}`)) return NextResponse.json({ error: "Juda ko'p izoh yuborildi. Birozdan so'ng qayta urinib ko'ring." }, { status: 429 });

  const parentId = typeof body?.parentId === "string" ? body.parentId : undefined;
  if (parentId && !(await commentExistsInContent(parentId, contentId))) return NextResponse.json({ error: "Javob berilayotgan izoh topilmadi." }, { status: 400 });

  await createComment(
    randomUUID(),
    contentId,
    isAuthenticated ? session?.user?.id : undefined,
    text,
    parentId,
    isAuthenticated ? undefined : { name, hash: guestHash },
  );

  const response = NextResponse.json({ ok: true });
  if (!jar.get("guest_comment_id")) response.cookies.set("guest_comment_id", guestId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
