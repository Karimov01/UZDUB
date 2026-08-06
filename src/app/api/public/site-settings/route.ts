import { NextResponse } from "next/server";
import { readSettings } from "@/lib/movies-store";
import { DEFAULT_TELEGRAM_CHANNEL_URL, normalizeTelegramChannelUrl } from "@/lib/telegram-channel";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(
      { telegramChannelUrl: normalizeTelegramChannelUrl(settings.telegramChannelUrl) ?? DEFAULT_TELEGRAM_CHANNEL_URL },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ telegramChannelUrl: DEFAULT_TELEGRAM_CHANNEL_URL }, { headers: { "cache-control": "no-store" } });
  }
}
