import { createHash, randomBytes, randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createTelegramLoginRequest, replaceTelegramCompletion, verifyTelegramLogin, type TelegramProfile } from "@/lib/movies-store";

const TEN_MINUTES = 10 * 60 * 1000;
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://uzdub.com").replace(/\/$/, "");
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const secureCode = () => randomBytes(24).toString("base64url");

export async function createTelegramAuthRequest() {
  const token = secureCode();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + TEN_MINUTES);
  await createTelegramLoginRequest(id, sha256(token), expiresAt);
  const username = (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
  if (!username) throw new Error("TELEGRAM_BOT_USERNAME sozlanmagan");
  return { id, expiresAt: expiresAt.toISOString(), deepLink: `https://t.me/${username}?start=auth_${token}` };
}

export async function verifyTelegramStart(token: string, profile: TelegramProfile) {
  const completionCode = secureCode();
  const result = await verifyTelegramLogin(sha256(token), sha256(completionCode), randomUUID(), profile);
  return { result, completionCode };
}

export async function issueBrowserCompletion(loginRequestId: string) {
  const completionCode = secureCode();
  const ok = await replaceTelegramCompletion(loginRequestId, sha256(completionCode));
  return ok ? completionCode : undefined;
}

export function completionUrl(code: string) { return `${siteUrl()}/auth/telegram/complete?code=${encodeURIComponent(code)}`; }
export function hashCompletionCode(code: string) { return sha256(code); }

export async function sendTelegramMessage(chatId: string, text: string, completionCode?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");
  const reply_markup = completionCode ? { inline_keyboard: [[{ text: "🌐 Saytga qaytish", url: completionUrl(completionCode) }]] } : undefined;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, reply_markup }) });
}

/** Telegram rasmi bo'lsa, bot tokenini oshkor qilmasdan mavjud R2 storage'ga nusxalaydi. */
export async function saveTelegramProfilePhoto(telegramId: string): Promise<string | undefined> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!token || !accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return undefined;
  try {
    const photos = await (await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${telegramId}&limit=1`)).json();
    const fileId = photos?.result?.photos?.[0]?.at(-1)?.file_id;
    if (!fileId) return undefined;
    const file = await (await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)).json();
    const filePath = file?.result?.file_path;
    if (!filePath) return undefined;
    const image = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!image.ok) return undefined;
    const key = `Uzdub_play_Data/avatars/${telegramId}-${Date.now()}.jpg`;
    const client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(await image.arrayBuffer()), ContentType: "image/jpeg" }));
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  } catch {
    return undefined;
  }
}
