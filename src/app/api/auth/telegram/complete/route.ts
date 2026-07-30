import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { issueBrowserCompletion } from "@/lib/auth/telegram";
export const runtime = "nodejs";
export async function POST() { const id = (await cookies()).get("telegram_login_request")?.value; if (!id) return NextResponse.json({ error: "Kirish so'rovi topilmadi" }, { status: 400 }); const code = await issueBrowserCompletion(id); if (!code) return NextResponse.json({ error: "Tasdiqlash muddati tugagan" }, { status: 400 }); return NextResponse.json({ code }); }
