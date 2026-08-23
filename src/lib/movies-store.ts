import { neon } from "@neondatabase/serverless";
import type { Movie } from "@/types/movie";

// Neon (PostgreSQL) — Vercel serverless uchun ideal (HTTP driver).
// DATABASE_URL .env.local (lokal) va Vercel Environment Variables (production) da.
function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL sozlanmagan");
  return neon(url);
}

// Jadval mavjudligini ta'minlash (instansiyaga bir marta)
let ready: Promise<unknown> | null = null;
function ensureTable() {
  if (!ready) {
    const sql = db();
    ready = (async () => {
      // ALTER TABLE buyruqlari yangi bazada ham ishonchli ishlashi uchun users jadvali avval yaratiladi.
      await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, telegram_id TEXT UNIQUE NOT NULL, telegram_username TEXT, first_name TEXT NOT NULL, last_name TEXT, language_code TEXT, telegram_photo_url TEXT, role TEXT NOT NULL DEFAULT 'USER', subscription_type TEXT NOT NULL DEFAULT 'FREE', premium_expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true, telegram_verified BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_login_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await Promise.all([
      sql`CREATE TABLE IF NOT EXISTS movies (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS app_settings (setting_key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS genres (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, color TEXT, created_at TIMESTAMPTZ DEFAULT now())`,
      sql`DO $$ BEGIN CREATE TABLE ai_office_requests (idempotency_key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('PENDING','COMPLETED','FAILED')), result JSONB, last_error_code TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()); EXCEPTION WHEN duplicate_table OR unique_violation THEN NULL; END $$`,
      sql`CREATE TABLE IF NOT EXISTS ai_office_publish_approvals (token_hash TEXT PRIMARY KEY, draft_id TEXT NOT NULL, admin_id BIGINT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS publisher_player_history (id TEXT PRIMARY KEY, content_id TEXT NOT NULL, episode_id TEXT, season INTEGER, episode INTEGER, old_player_url TEXT NOT NULL, new_player_url TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'telegram_publisher', changed_at TIMESTAMPTZ NOT NULL DEFAULT now(), undone_at TIMESTAMPTZ)`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT NOT NULL DEFAULT 'FREE'`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS receive_telegram_admin_notifications BOOLEAN NOT NULL DEFAULT false`,
      sql`CREATE TABLE IF NOT EXISTS user_content_lists (user_id TEXT NOT NULL, movie_id TEXT NOT NULL, list_type TEXT NOT NULL CHECK (list_type IN ('FAVORITE', 'WATCH_LATER')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, movie_id, list_type))`,
      sql`CREATE TABLE IF NOT EXISTS user_watch_progress (user_id TEXT NOT NULL, movie_id TEXT NOT NULL, episode_key TEXT NOT NULL DEFAULT '', position_seconds REAL NOT NULL DEFAULT 0, duration_seconds REAL NOT NULL DEFAULT 0, completed BOOLEAN NOT NULL DEFAULT false, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, movie_id, episode_key))`,
      sql`CREATE TABLE IF NOT EXISTS telegram_login_requests (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, completion_hash TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'PENDING', user_id TEXT, telegram_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL, verified_at TIMESTAMPTZ, completion_expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ)`,
      ]);
      await sql`CREATE INDEX IF NOT EXISTS user_content_lists_user_type_idx ON user_content_lists (user_id, list_type, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS user_watch_progress_user_updated_idx ON user_watch_progress (user_id, updated_at DESC)`;
      // Ilgari yaratilgan yagona adminni bir marta avtomatik qabul qiluvchi qilamiz.
      await sql`UPDATE users SET receive_telegram_admin_notifications = true WHERE id = (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND is_active = true ORDER BY created_at ASC LIMIT 1) AND NOT EXISTS (SELECT 1 FROM users WHERE receive_telegram_admin_notifications = true)`;
    })();
  }
  return ready;
}

export type TelegramProfile = { telegramId: string; firstName: string; lastName?: string; username?: string; languageCode?: string; photoUrl?: string };
export type SubscriptionType = "FREE" | "PREMIUM";
export type StoredUser = { id: string; telegramId: string; telegramUsername?: string; firstName: string; lastName?: string; telegramPhotoUrl?: string; role: string; subscriptionType: SubscriptionType; premiumExpiresAt?: string; isActive: boolean; receiveTelegramAdminNotifications: boolean; createdAt: string; lastLoginAt: string };
export type UserStats = { total: number; free: number; premium: number; admins: number };

export async function createTelegramLoginRequest(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await ensureTable(); const sql = db();
  await sql`INSERT INTO telegram_login_requests (id, token_hash, expires_at) VALUES (${id}, ${tokenHash}, ${expiresAt.toISOString()})`;
}

export async function getTelegramLoginStatus(id: string): Promise<{ status: string; expiresAt: string } | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT status, expires_at AS "expiresAt" FROM telegram_login_requests WHERE id = ${id} LIMIT 1` as { status: string; expiresAt: string }[];
  const item = rows[0];
  if (!item) return undefined;
  if (item.status === "PENDING" && new Date(item.expiresAt).getTime() <= Date.now()) {
    await sql`UPDATE telegram_login_requests SET status = 'EXPIRED' WHERE id = ${id} AND status = 'PENDING'`;
    return { ...item, status: "EXPIRED" };
  }
  return item;
}

export type TelegramLoginVerification = { status: "VERIFIED" | "EXPIRED" | "INVALID"; userId?: string; isNewUser: boolean };

export async function verifyTelegramLogin(tokenHash: string, completionHash: string, newUserId: string, profile: TelegramProfile): Promise<TelegramLoginVerification> {
  await ensureTable(); const sql = db();
  const requests = await sql`UPDATE telegram_login_requests SET status = 'VERIFIED', telegram_id = ${profile.telegramId}, completion_hash = ${completionHash}, verified_at = now(), completion_expires_at = now() + interval '5 minutes' WHERE token_hash = ${tokenHash} AND status = 'PENDING' AND expires_at > now() RETURNING id` as { id: string }[];
  const request = requests[0];
  if (request) {
    const accounts = await sql`INSERT INTO users (id, telegram_id, telegram_username, first_name, last_name, language_code, telegram_photo_url) VALUES (${newUserId}, ${profile.telegramId}, ${profile.username ?? null}, ${profile.firstName}, ${profile.lastName ?? null}, ${profile.languageCode ?? null}, ${profile.photoUrl ?? null}) ON CONFLICT (telegram_id) DO UPDATE SET telegram_username = EXCLUDED.telegram_username, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, language_code = EXCLUDED.language_code, telegram_photo_url = COALESCE(EXCLUDED.telegram_photo_url, users.telegram_photo_url), updated_at = now(), last_login_at = now(), telegram_verified = true RETURNING id, (xmax = 0) AS "isNewUser"` as { id: string; isNewUser: boolean }[];
    const account = accounts[0];
    if (!account) throw new Error("Telegram foydalanuvchisi saqlanmadi");
    await sql`UPDATE telegram_login_requests SET user_id = ${account.id} WHERE id = ${request.id} AND status = 'VERIFIED'`;
    return { status: "VERIFIED", userId: account.id, isNewUser: account.isNewUser };
  }
  const status = await getTelegramLoginStatusByHash(tokenHash);
  return { status: status === "EXPIRED" ? "EXPIRED" : "INVALID", isNewUser: false };
}

async function getTelegramLoginStatusByHash(tokenHash: string): Promise<string | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT status, expires_at AS "expiresAt" FROM telegram_login_requests WHERE token_hash = ${tokenHash} LIMIT 1` as { status: string; expiresAt: string }[];
  const item = rows[0]; if (!item) return undefined;
  return item.status === "PENDING" && new Date(item.expiresAt).getTime() <= Date.now() ? "EXPIRED" : item.status;
}

export async function consumeTelegramCompletion(completionHash: string): Promise<StoredUser | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`
    WITH completed AS (
      UPDATE telegram_login_requests SET status = 'USED', used_at = now()
      WHERE completion_hash = ${completionHash}
        AND completion_expires_at > now()
        AND status = 'VERIFIED'
      RETURNING user_id
    )
    SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, subscription_type AS "subscriptionType", premium_expires_at AS "premiumExpiresAt", is_active AS "isActive", receive_telegram_admin_notifications AS "receiveTelegramAdminNotifications", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users WHERE id = (SELECT user_id FROM completed)
  ` as StoredUser[];
  return rows[0];
}

export async function replaceTelegramCompletion(loginRequestId: string, completionHash: string): Promise<boolean> {
  await ensureTable(); const sql = db();
  const rows = await sql`UPDATE telegram_login_requests SET completion_hash = ${completionHash}, completion_expires_at = now() + interval '5 minutes' WHERE id = ${loginRequestId} AND status = 'VERIFIED' AND completion_expires_at > now() RETURNING id` as unknown[];
  return rows.length > 0;
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureTable(); const sql = db();
  return await sql`SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, subscription_type AS "subscriptionType", premium_expires_at AS "premiumExpiresAt", is_active AS "isActive", receive_telegram_admin_notifications AS "receiveTelegramAdminNotifications", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users ORDER BY created_at DESC` as StoredUser[];
}

export async function getUserStats(): Promise<UserStats> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT COUNT(*) FILTER (WHERE is_active) ::int AS total, COUNT(*) FILTER (WHERE is_active AND subscription_type = 'FREE') ::int AS free, COUNT(*) FILTER (WHERE is_active AND subscription_type = 'PREMIUM') ::int AS premium, COUNT(*) FILTER (WHERE role IN ('ADMIN', 'SUPER_ADMIN')) ::int AS admins FROM users` as UserStats[];
  return rows[0] ?? { total: 0, free: 0, premium: 0, admins: 0 };
}

export async function getUserProfile(id: string): Promise<StoredUser | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, subscription_type AS "subscriptionType", premium_expires_at AS "premiumExpiresAt", is_active AS "isActive", receive_telegram_admin_notifications AS "receiveTelegramAdminNotifications", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users WHERE id = ${id} LIMIT 1` as StoredUser[];
  return rows[0];
}

export async function updateUserAdmin(id: string, input: { role: "USER" | "ADMIN"; subscriptionType: SubscriptionType; isActive: boolean }): Promise<StoredUser | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`UPDATE users SET role = ${input.role}, subscription_type = ${input.subscriptionType}, is_active = ${input.isActive}, premium_expires_at = CASE WHEN ${input.subscriptionType} = 'PREMIUM' THEN COALESCE(premium_expires_at, now() + interval '30 days') ELSE NULL END, updated_at = now() WHERE id = ${id} RETURNING id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, subscription_type AS "subscriptionType", premium_expires_at AS "premiumExpiresAt", is_active AS "isActive", receive_telegram_admin_notifications AS "receiveTelegramAdminNotifications", created_at AS "createdAt", last_login_at AS "lastLoginAt"` as StoredUser[];
  return rows[0];
}

export async function getTelegramNotificationRecipient(): Promise<StoredUser | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, subscription_type AS "subscriptionType", premium_expires_at AS "premiumExpiresAt", is_active AS "isActive", receive_telegram_admin_notifications AS "receiveTelegramAdminNotifications", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users WHERE receive_telegram_admin_notifications = true AND role IN ('ADMIN', 'SUPER_ADMIN') AND is_active = true LIMIT 1` as StoredUser[];
  return rows[0];
}

export async function getTelegramNotificationAdmins(): Promise<StoredUser[]> {
  await ensureTable(); const sql = db();
  return await sql`SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, subscription_type AS "subscriptionType", premium_expires_at AS "premiumExpiresAt", is_active AS "isActive", receive_telegram_admin_notifications AS "receiveTelegramAdminNotifications", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') ORDER BY CASE WHEN role = 'SUPER_ADMIN' THEN 0 ELSE 1 END, created_at ASC` as StoredUser[];
}

export async function setTelegramNotificationRecipient(id: string): Promise<StoredUser | undefined> {
  await ensureTable(); const sql = db();
  const selected = await sql`SELECT id FROM users WHERE id = ${id} AND role IN ('ADMIN', 'SUPER_ADMIN') AND is_active = true AND telegram_id IS NOT NULL LIMIT 1` as { id: string }[];
  if (!selected[0]) return undefined;
  await sql`UPDATE users SET receive_telegram_admin_notifications = CASE WHEN id = ${id} THEN true ELSE false END, updated_at = now() WHERE role IN ('ADMIN', 'SUPER_ADMIN')`;
  return getTelegramNotificationRecipient();
}

export async function isOnlyAdministrativeUser(id: string): Promise<boolean> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND is_active = true` as { count: number }[];
  if (rows[0]?.count !== 1) return false;
  const user = await getUserProfile(id);
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export async function getUserListIds(userId: string, type: "FAVORITE" | "WATCH_LATER"): Promise<string[]> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT movie_id AS "movieId" FROM user_content_lists WHERE user_id = ${userId} AND list_type = ${type} ORDER BY created_at DESC` as { movieId: string }[];
  return rows.map((row) => row.movieId);
}

export async function toggleUserListItem(userId: string, movieId: string, type: "FAVORITE" | "WATCH_LATER"): Promise<boolean> {
  await ensureTable(); const sql = db();
  const removed = await sql`DELETE FROM user_content_lists WHERE user_id = ${userId} AND movie_id = ${movieId} AND list_type = ${type} RETURNING movie_id` as unknown[];
  if (removed.length) return false;
  await sql`INSERT INTO user_content_lists (user_id, movie_id, list_type) VALUES (${userId}, ${movieId}, ${type}) ON CONFLICT DO NOTHING`;
  return true;
}

export type StoredWatchProgress = { movieId: string; episodeId?: string; positionSeconds: number; durationSeconds: number; completed: boolean; updatedAt: string };

export async function saveWatchProgress(userId: string, input: Omit<StoredWatchProgress, "updatedAt">): Promise<StoredWatchProgress> {
  await ensureTable(); const sql = db();
  const episodeKey = input.episodeId ?? "";
  const rows = await sql`INSERT INTO user_watch_progress (user_id, movie_id, episode_key, position_seconds, duration_seconds, completed) VALUES (${userId}, ${input.movieId}, ${episodeKey}, ${input.positionSeconds}, ${input.durationSeconds}, ${input.completed}) ON CONFLICT (user_id, movie_id, episode_key) DO UPDATE SET position_seconds = EXCLUDED.position_seconds, duration_seconds = EXCLUDED.duration_seconds, completed = EXCLUDED.completed, updated_at = now() RETURNING movie_id AS "movieId", NULLIF(episode_key, '') AS "episodeId", position_seconds AS "positionSeconds", duration_seconds AS "durationSeconds", completed, updated_at AS "updatedAt"` as StoredWatchProgress[];
  return rows[0];
}

export async function getWatchProgress(userId: string, movieId: string, episodeId?: string): Promise<StoredWatchProgress | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT movie_id AS "movieId", NULLIF(episode_key, '') AS "episodeId", position_seconds AS "positionSeconds", duration_seconds AS "durationSeconds", completed, updated_at AS "updatedAt" FROM user_watch_progress WHERE user_id = ${userId} AND movie_id = ${movieId} AND episode_key = ${episodeId ?? ""} LIMIT 1` as StoredWatchProgress[];
  return rows[0];
}

export async function getWatchProgresses(userId: string, limit = 12): Promise<StoredWatchProgress[]> {
  await ensureTable(); const sql = db();
  return await sql`SELECT movie_id AS "movieId", NULLIF(episode_key, '') AS "episodeId", position_seconds AS "positionSeconds", duration_seconds AS "durationSeconds", completed, updated_at AS "updatedAt" FROM user_watch_progress WHERE user_id = ${userId} AND completed = false AND position_seconds > 0 ORDER BY updated_at DESC LIMIT ${limit}` as StoredWatchProgress[];
}

export type AppSettings = {
  siteName: string; siteDesc: string; maintenanceMode: boolean; registrationOpen: boolean;
  emailNotifications: boolean; pushNotifications: boolean; defaultLanguage: string;
  contentPerPage: string; maxUploadSize: string; watermarkEnabled: boolean; telegramChannelUrl: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  siteName: "UZDUB Play", siteDesc: "O'zbekistonning premium kino va serial platformasi",
  maintenanceMode: false, registrationOpen: true, emailNotifications: true, pushNotifications: false,
  defaultLanguage: "uz", contentPerPage: "24", maxUploadSize: "500", watermarkEnabled: true,
  telegramChannelUrl: "https://t.me/uzdub_media",
};

export async function readSettings(): Promise<AppSettings> {
  await ensureTable();
  const sql = db();
  const rows = await sql`SELECT data FROM app_settings WHERE setting_key = 'site' LIMIT 1` as { data: Partial<AppSettings> }[];
  return { ...DEFAULT_SETTINGS, ...(rows[0]?.data ?? {}) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await ensureTable();
  const sql = db();
  await sql`INSERT INTO app_settings (setting_key, data, updated_at) VALUES ('site', ${JSON.stringify(settings)}::jsonb, now()) ON CONFLICT (setting_key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}

export type StoredGenre = { id: string; name: string; slug: string; color?: string };
export async function readGenres(): Promise<StoredGenre[]> {
  await ensureTable(); const sql = db();
  return (await sql`SELECT id, name, slug, color FROM genres ORDER BY name ASC`) as StoredGenre[];
}
export async function saveGenre(genre: StoredGenre): Promise<void> {
  await ensureTable(); const sql = db();
  await sql`INSERT INTO genres (id, name, slug, color) VALUES (${genre.id}, ${genre.name}, ${genre.slug}, ${genre.color ?? null}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, color = EXCLUDED.color`;
}
export async function deleteGenre(id: string): Promise<boolean> {
  await ensureTable(); const sql = db(); const rows = await sql`DELETE FROM genres WHERE id = ${id} RETURNING id` as unknown[]; return rows.length > 0;
}

export async function readMovies(): Promise<Movie[]> {
  await ensureTable();
  const sql = db();
  const rows = (await sql`SELECT data FROM movies ORDER BY created_at DESC`) as { data: Movie }[];
  return rows.map((r) => r.data);
}

export async function addMovie(movie: Movie): Promise<void> {
  await ensureTable();
  const sql = db();
  await sql`
    INSERT INTO movies (id, slug, data)
    VALUES (${movie.id}, ${movie.slug}, ${JSON.stringify(movie)}::jsonb)
  `;
}

export async function slugExists(slug: string): Promise<boolean> {
  await ensureTable();
  const sql = db();
  const rows = (await sql`SELECT 1 FROM movies WHERE slug = ${slug} LIMIT 1`) as unknown[];
  return rows.length > 0;
}

export async function getMovie(id: string): Promise<Movie | undefined> {
  await ensureTable();
  const sql = db();
  const rows = (await sql`SELECT data FROM movies WHERE id = ${id} LIMIT 1`) as { data: Movie }[];
  return rows[0]?.data;
}

export async function updateMovie(id: string, movie: Movie): Promise<boolean> {
  await ensureTable();
  const sql = db();
  const rows = (await sql`
    UPDATE movies SET data = ${JSON.stringify(movie)}::jsonb, slug = ${movie.slug}, created_at = created_at
    WHERE id = ${id} RETURNING id
  `) as unknown[];
  return rows.length > 0;
}

export type PublisherPlayerHistory = {
  id: string; contentId: string; episodeId?: string; season?: number; episode?: number;
  oldPlayerUrl: string; newPlayerUrl: string; source: string; changedAt: string; undoneAt?: string;
};

export async function createPublisherPlayerHistory(input: {
  id: string; contentId: string; episodeId?: string; season?: number; episode?: number;
  oldPlayerUrl: string; newPlayerUrl: string;
}): Promise<void> {
  await ensureTable(); const sql = db();
  await sql`INSERT INTO publisher_player_history (id,content_id,episode_id,season,episode,old_player_url,new_player_url,source) VALUES (${input.id},${input.contentId},${input.episodeId ?? null},${input.season ?? null},${input.episode ?? null},${input.oldPlayerUrl},${input.newPlayerUrl},'telegram_publisher')`;
}

export async function getPublisherPlayerHistory(id: string): Promise<PublisherPlayerHistory | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`SELECT id,content_id AS "contentId",episode_id AS "episodeId",season,episode,old_player_url AS "oldPlayerUrl",new_player_url AS "newPlayerUrl",source,changed_at AS "changedAt",undone_at AS "undoneAt" FROM publisher_player_history WHERE id=${id} LIMIT 1` as PublisherPlayerHistory[];
  return rows[0];
}

export async function markPublisherPlayerHistoryUndone(id: string): Promise<boolean> {
  await ensureTable(); const sql = db();
  const rows = await sql`UPDATE publisher_player_history SET undone_at=now() WHERE id=${id} AND undone_at IS NULL RETURNING id` as unknown[];
  return rows.length > 0;
}

export async function createAiOfficePublishApproval(input: { tokenHash: string; draftId: string; adminId: number; expiresAt: string }): Promise<void> {
  await ensureTable(); const sql = db();
  await sql`INSERT INTO ai_office_publish_approvals (token_hash, draft_id, admin_id, expires_at) VALUES (${input.tokenHash}, ${input.draftId}, ${input.adminId}, ${input.expiresAt})
    ON CONFLICT (token_hash) DO UPDATE SET draft_id = EXCLUDED.draft_id, admin_id = EXCLUDED.admin_id, expires_at = EXCLUDED.expires_at, consumed_at = NULL`;
}

export async function consumeAiOfficePublishApproval(input: { tokenHash: string; adminId: number }): Promise<{ draftId: string } | undefined> {
  await ensureTable(); const sql = db();
  const rows = await sql`UPDATE ai_office_publish_approvals SET consumed_at = now() WHERE token_hash = ${input.tokenHash} AND admin_id = ${input.adminId} AND consumed_at IS NULL AND expires_at > now() RETURNING draft_id AS "draftId"` as { draftId: string }[];
  return rows[0];
}

export async function deleteMovie(id: string): Promise<boolean> {
  await ensureTable();
  const sql = db();
  const rows = (await sql`DELETE FROM movies WHERE id = ${id} RETURNING id`) as unknown[];
  return rows.length > 0;
}

export async function incrementView(id: string): Promise<number | null> {
  await ensureTable();
  const sql = db();
  const rows = (await sql`
    UPDATE movies
    SET data = jsonb_set(data, '{viewCount}', (COALESCE((data->>'viewCount')::int, 0) + 1)::text::jsonb)
    WHERE id = ${id}
    RETURNING (data->>'viewCount')::int AS count
  `) as { count: number }[];
  return rows[0]?.count ?? null;
}

export async function getMovieBySlug(slug: string): Promise<Movie | undefined> {
  await ensureTable(); const sql = db();
  const rows = (await sql`SELECT data FROM movies WHERE slug = ${slug} LIMIT 1`) as { data: Movie }[];
  return rows[0]?.data;
}

type AiOfficeClaim = { status: "CLAIMED" } | { status: "REUSED"; result: { id: string; status: "DRAFT"; url?: string } } | { status: "CONFLICT" | "IN_PROGRESS" };
export async function claimAiOfficeRequest(idempotencyKey: string, hash: string): Promise<AiOfficeClaim> {
  await ensureTable(); const sql = db();
  const inserted = await sql`INSERT INTO ai_office_requests (idempotency_key, payload_hash, state) VALUES (${idempotencyKey}, ${hash}, 'PENDING') ON CONFLICT DO NOTHING RETURNING idempotency_key` as unknown[];
  if (inserted.length) return { status: "CLAIMED" };
  const rows = await sql`SELECT payload_hash AS "payloadHash", state, result FROM ai_office_requests WHERE idempotency_key = ${idempotencyKey} LIMIT 1` as { payloadHash: string; state: string; result?: { id: string; status: "DRAFT"; url?: string } }[];
  const existing = rows[0];
  if (!existing || existing.payloadHash !== hash) return { status: "CONFLICT" };
  if (existing.state === "COMPLETED" && existing.result) return { status: "REUSED", result: existing.result };
  if (existing.state === "FAILED") { const retried = await sql`UPDATE ai_office_requests SET state = 'PENDING', last_error_code = NULL, updated_at = now() WHERE idempotency_key = ${idempotencyKey} AND payload_hash = ${hash} AND state = 'FAILED' RETURNING idempotency_key` as unknown[]; if (retried.length) return { status: "CLAIMED" }; }
  return { status: "IN_PROGRESS" };
}
export async function completeAiOfficeRequest(idempotencyKey: string, result: { id: string; status: "DRAFT"; url?: string }): Promise<void> { await ensureTable(); const sql = db(); await sql`UPDATE ai_office_requests SET state = 'COMPLETED', result = ${JSON.stringify(result)}::jsonb, updated_at = now() WHERE idempotency_key = ${idempotencyKey} AND state = 'PENDING'`; }
export async function failAiOfficeRequest(idempotencyKey: string, code: string): Promise<void> { await ensureTable(); const sql = db(); await sql`UPDATE ai_office_requests SET state = 'FAILED', last_error_code = ${code}, updated_at = now() WHERE idempotency_key = ${idempotencyKey} AND state = 'PENDING'`; }

export async function incrementEpisodeView(movieId: string, episodeId: string): Promise<{ contentCount: number; episodeCount: number } | null> {
  await ensureTable();
  const sql = db();
  const rows = await sql`
    UPDATE movies
    SET data = jsonb_set(
      jsonb_set(
        data,
        '{viewCount}',
        (COALESCE((data->>'viewCount')::int, 0) + 1)::text::jsonb
      ),
      '{episodes}',
      COALESCE((
        SELECT jsonb_agg(
          CASE WHEN episode->>'id' = ${episodeId}
            THEN jsonb_set(episode, '{viewCount}', (COALESCE((episode->>'viewCount')::int, 0) + 1)::text::jsonb)
            ELSE episode
          END
        )
        FROM jsonb_array_elements(COALESCE(data->'episodes', '[]'::jsonb)) AS episode
      ), '[]'::jsonb)
    )
    WHERE id = ${movieId}
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(data->'episodes', '[]'::jsonb)) AS episode WHERE episode->>'id' = ${episodeId})
    RETURNING
      (data->>'viewCount')::int AS "contentCount",
      (SELECT (episode->>'viewCount')::int FROM jsonb_array_elements(data->'episodes') AS episode WHERE episode->>'id' = ${episodeId} LIMIT 1) AS "episodeCount"
  ` as { contentCount: number; episodeCount: number }[];
  return rows[0] ?? null;
}
