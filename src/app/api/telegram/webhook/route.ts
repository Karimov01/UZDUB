import { NextResponse } from "next/server";
import { saveTelegramProfilePhoto, sendNewUserAdminNotification, sendTelegramMessage, verifyTelegramStart } from "@/lib/auth/telegram";
import { getTelegramNotificationRecipient, getUserProfile, getUserStats } from "@/lib/movies-store";
export const runtime = "nodejs";
type Update = { message?: { text?: string; chat?: { id: number }; from?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string } } };
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  const update = await request.json() as Update;
  const message = update.message; const text = message?.text?.trim(); const from = message?.from;
  if (!message?.chat?.id || !from || !text?.startsWith("/start")) return NextResponse.json({ ok: true });
  const payload = text.split(/\s+/, 2)[1] || "";
  if (!payload.startsWith("auth_")) { await sendTelegramMessage(String(message.chat.id), "UZDUB Play'ga xush kelibsiz. Saytdagi Kirish tugmasi orqali xavfsiz havola yarating."); return NextResponse.json({ ok: true }); }
  const photoUrl = await saveTelegramProfilePhoto(String(from.id));
  const { result, completionCode, isNewUser, userId } = await verifyTelegramStart(payload.slice(5), { telegramId: String(from.id), firstName: from.first_name, lastName: from.last_name, username: from.username, languageCode: from.language_code, photoUrl });
  if (result === "VERIFIED") {
    await sendTelegramMessage(String(message.chat.id), "Telegram akkauntingiz tasdiqlandi. Quyidagi \"Saytga kirish\" tugmasini bosing.", completionCode);
    if (isNewUser && userId) {
      const [recipient, user, stats] = await Promise.all([getTelegramNotificationRecipient(), getUserProfile(userId), getUserStats()]);
      if (recipient && user) await sendNewUserAdminNotification(recipient, user, stats.total);
    }
  }
  else if (result === "EXPIRED") await sendTelegramMessage(String(message.chat.id), "Ushbu kirish havolasining amal qilish muddati tugagan. Xavfsizlik sababli havola faqat 10 daqiqa amal qiladi. Saytga qaytib yangi havola yarating.");
  else await sendTelegramMessage(String(message.chat.id), "Bu havola avval tasdiqlangan yoki yaroqsiz. Agar saytda \"Telegram tasdiqlandi\" yozuvi chiqsa, saytdagi \"Saytga kirish\" tugmasini bosing.");
  return NextResponse.json({ ok: true });
}
