import { NextResponse } from "next/server";
import { DEFAULT_SETTINGS, readSettings, saveSettings, type AppSettings } from "@/lib/movies-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ settings: await readSettings() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: `Sozlamalarni o'qib bo'lmadi. ${message}`.trim() }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Partial<AppSettings>;
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...body };
    await saveSettings(settings);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: `Sozlamalarni saqlab bo'lmadi. ${message}`.trim() }, { status: 500 });
  }
}
