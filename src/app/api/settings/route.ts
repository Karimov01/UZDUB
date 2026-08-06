import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin-access";
import { DEFAULT_SETTINGS, readSettings, saveSettings, type AppSettings } from "@/lib/movies-store";
import { normalizeTelegramChannelUrl } from "@/lib/telegram-channel";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminAccess()).isAdmin) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  try {
    return NextResponse.json({ settings: await readSettings() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: `Sozlamalarni o'qib bo'lmadi. ${message}`.trim() }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminAccess()).isAdmin) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  try {
    const body = await request.json() as Partial<AppSettings>;
    const current = await readSettings();
    const telegramChannelUrl = normalizeTelegramChannelUrl(body.telegramChannelUrl ?? current.telegramChannelUrl);
    if (!telegramChannelUrl) return NextResponse.json({ error: "Telegram kanal havolasini to'g'ri kiriting." }, { status: 400 });
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...current, ...body, telegramChannelUrl };
    await saveSettings(settings);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: `Sozlamalarni saqlab bo'lmadi. ${message}`.trim() }, { status: 500 });
  }
}
