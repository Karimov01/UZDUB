import { NextResponse } from "next/server";
import { getTelegramLoginStatus } from "@/lib/movies-store";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const item = await getTelegramLoginStatus(id); return item ? NextResponse.json(item) : NextResponse.json({ error: "So'rov topilmadi" }, { status: 404 }); }
