import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { validBearer } from "@/lib/ai-office-contract";
import { createAiOfficePublishApproval, getMovie } from "@/lib/movies-store";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  if (!validBearer(request.headers.get("authorization"), process.env.UZDUB_AI_OFFICE_API_KEY)) return reply({ error: "UNAUTHORIZED" }, 401);
  const key = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[A-Za-z0-9:_-]{8,200}$/.test(key)) return reply({ error: "INVALID_IDEMPOTENCY_KEY" }, 400);
  const signingSecret = process.env.APPROVAL_SIGNING_SECRET?.trim(), botToken = process.env.AI_OFFICE_TELEGRAM_BOT_TOKEN?.trim();
  const adminIds = parseAdminIds(process.env.ADMIN_TELEGRAM_IDS);
  if (!signingSecret || signingSecret.length < 32 || !botToken || adminIds.length === 0) return reply({ error: "APPROVAL_CHANNEL_UNCONFIGURED" }, 503);
  const { id } = await params, movie = await getMovie(id);
  if (!movie) return reply({ error: "DRAFT_NOT_FOUND" }, 404);
  if (movie.status === "PUBLISHED") return reply({ id, status: "PUBLISHED", url: publicUrl(movie) }, 200);
  if (movie.status !== "DRAFT") return reply({ error: "DRAFT_NOT_PUBLISHABLE" }, 409);
  if (!movie.title || !movie.originalTitle || !movie.year || !movie.description || !movie.posterUrl || !movie.videoUrl) return reply({ error: "QA_REQUIRED_FIELDS_MISSING" }, 409);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  for (const adminId of adminIds) {
    const token = createHmac("sha256", signingSecret).update(`${id}:${key}:${adminId}`).digest("base64url").slice(0, 32);
    await createAiOfficePublishApproval({ tokenHash: createHash("sha256").update(token).digest("hex"), draftId: id, adminId, expiresAt });
    await telegram(botToken, "sendMessage", {
      chat_id: adminId,
      text: `<b>${escapeHtml(movie.title)}</b> (${movie.year})\n\nSEO va kino ma'lumotlari tayyor. Player biriktirilgan. Nashr qilinsinmi?`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "✅ NASHR QILISH", callback_data: `UZDUB_PUBLISH:${token}` }], [{ text: "✏️ Admin panelda ko'rish", url: `https://uzdub.com/admin/kinolar/${id}` }]] },
    });
  }
  return reply({ id, status: "DRAFT", approvalRequired: true, approvalRequested: true, expiresAt }, 202);
}

function parseAdminIds(raw: string | undefined): number[] { return [...new Set((raw ?? "").split(",").map((value) => Number(value.trim())).filter(Number.isSafeInteger))]; }
async function telegram(token: string, method: string, body: Record<string, unknown>): Promise<void> { const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Telegram ${method} failed with HTTP ${response.status}`); }
function publicUrl(movie: { type: string; slug: string }): string { return `https://uzdub.com/${movie.type === "SERIAL" ? "serial" : "kino"}/${movie.slug}`; }
function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function reply(body: unknown, status: number) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
