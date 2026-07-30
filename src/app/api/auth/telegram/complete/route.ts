import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { issueBrowserCompletion } from "@/lib/auth/telegram";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { id?: unknown };
  const requestId = typeof body.id === "string" ? body.id : (await cookies()).get("telegram_login_request")?.value;
  if (!requestId) return NextResponse.json({ error: "Kirish so'rovi topilmadi" }, { status: 400 });
  const code = await issueBrowserCompletion(requestId);
  if (!code) return NextResponse.json({ error: "Tasdiqlash muddati tugagan" }, { status: 400 });
  return NextResponse.json({ code });
}
