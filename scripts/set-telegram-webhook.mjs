import { createHash } from "node:crypto";

const token = process.env.TELEGRAM_BOT_TOKEN;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token || !siteUrl || !secret) throw new Error("TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET va NEXT_PUBLIC_SITE_URL kerak.");
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: `${siteUrl}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: false }) });
const data = await response.json();
if (!response.ok || !data.ok) throw new Error(data.description || "Webhook o'rnatilmadi");
console.log("Telegram webhook o'rnatildi:", `${siteUrl}/api/telegram/webhook`);
console.log("Webhook secret fingerprint:", createHash("sha256").update(secret).digest("hex").slice(0, 12));
