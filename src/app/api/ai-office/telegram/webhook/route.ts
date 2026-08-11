import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { handleAiOfficeTelegramUpdate, type AiOfficeTelegramUpdate } from "@/lib/ai-office-telegram";

export const runtime = "nodejs";
function equal(expected: string, actual: string | null) { if (!actual) return false; const a = Buffer.from(expected), b = Buffer.from(actual); return a.length === b.length && timingSafeEqual(a, b); }

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !equal(secret, request.headers.get("x-telegram-bot-api-secret-token"))) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const update = await request.json().catch(() => null) as AiOfficeTelegramUpdate | null;
  if (update) await handleAiOfficeTelegramUpdate(update);
  return NextResponse.json({ ok: true });
}
