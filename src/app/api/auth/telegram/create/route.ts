import { NextResponse } from "next/server";
import { createTelegramAuthRequest } from "@/lib/auth/telegram";
export const runtime = "nodejs";
const attempts = new Map<string, number>();
export async function POST(request: Request) { const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local"; const previous = attempts.get(ip) || 0; if (Date.now() - previous < 15_000) return NextResponse.json({ error: "Yangi havola uchun biroz kuting." }, { status: 429 }); attempts.set(ip, Date.now()); try { const auth = await createTelegramAuthRequest(); const response = NextResponse.json(auth); response.cookies.set("telegram_login_request", auth.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" }); return response; } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Havola yaratilmadi" }, { status: 500 }); } }
