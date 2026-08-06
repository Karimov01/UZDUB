export const DEFAULT_TELEGRAM_CHANNEL_URL = "https://t.me/uzdub_media";

export function normalizeTelegramChannelUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input) return null;

  const username = input.startsWith("@")
    ? input.slice(1)
    : input.replace(/^https?:\/\/(?:www\.)?t\.me\//i, "").replace(/^t\.me\//i, "");

  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  return `https://t.me/${username}`;
}
