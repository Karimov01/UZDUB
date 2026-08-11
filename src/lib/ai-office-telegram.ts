import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { consumeAiOfficePublishApproval, getMovie, updateMovie } from "@/lib/movies-store";

export type AiOfficeTelegramUpdate = { callback_query?: { id?: string; data?: string; from?: { id?: number }; message?: { chat?: { id?: number } } } };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function handleAiOfficeTelegramUpdate(update: AiOfficeTelegramUpdate): Promise<boolean> {
  const callback = update.callback_query;
  if (!callback?.data?.startsWith("UZDUB_PUBLISH:")) return false;
  const actorId = callback.from?.id, match = /^UZDUB_PUBLISH:([A-Za-z0-9_-]{24,32})$/.exec(callback.data);
  if (!callback.id || !Number.isSafeInteger(actorId) || !match) return true;
  const approval = await consumeAiOfficePublishApproval({ tokenHash: hash(match[1]!), adminId: actorId! });
  if (!approval) { await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "Tasdiq eskirgan yoki avval ishlatilgan", show_alert: true }); return true; }
  const movie = await getMovie(approval.draftId);
  const qa = movie && movie.status === "DRAFT" && movie.title && movie.originalTitle && movie.year && movie.description && movie.posterUrl && movie.videoUrl;
  if (!qa) { await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "QA o'tmadi yoki draft mavjud emas", show_alert: true }); return true; }
  const now = new Date().toISOString();
  await updateMovie(movie.id, { ...movie, status: "PUBLISHED", publishedAt: now, updatedAt: now });
  revalidatePath("/kino"); revalidatePath(`/kino/${movie.slug}`); const url = `https://uzdub.com/kino/${movie.slug}`;
  await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "Nashr qilindi" });
  if (callback.message?.chat?.id) await telegram("sendMessage", { chat_id: callback.message.chat.id, text: `<b>${escapeHtml(movie.title)}</b> nashr qilindi.\n${url}`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "Saytda ko'rish", url }]] } });
  return true;
}

async function telegram(method: string, body: Record<string, unknown>) { const token = process.env.TELEGRAM_BOT_TOKEN; if (!token) throw new Error("Telegram is not configured"); const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Telegram ${method} failed with HTTP ${response.status}`); }
function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
