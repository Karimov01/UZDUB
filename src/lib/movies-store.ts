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
    ready = Promise.all([
      sql`CREATE TABLE IF NOT EXISTS movies (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS app_settings (setting_key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS genres (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, color TEXT, created_at TIMESTAMPTZ DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, telegram_id TEXT UNIQUE NOT NULL, telegram_username TEXT, first_name TEXT NOT NULL, last_name TEXT, language_code TEXT, telegram_photo_url TEXT, role TEXT NOT NULL DEFAULT 'USER', is_active BOOLEAN NOT NULL DEFAULT true, telegram_verified BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_login_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      sql`CREATE TABLE IF NOT EXISTS telegram_login_requests (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, completion_hash TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'PENDING', user_id TEXT, telegram_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL, verified_at TIMESTAMPTZ, completion_expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ)`,
    ]);
  }
  return ready;
}

export type TelegramProfile = { telegramId: string; firstName: string; lastName?: string; username?: string; languageCode?: string; photoUrl?: string };
export type StoredUser = { id: string; telegramId: string; telegramUsername?: string; firstName: string; lastName?: string; telegramPhotoUrl?: string; role: string; isActive: boolean; createdAt: string; lastLoginAt: string };

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

export async function verifyTelegramLogin(tokenHash: string, completionHash: string, newUserId: string, profile: TelegramProfile): Promise<"VERIFIED" | "EXPIRED" | "INVALID"> {
  await ensureTable(); const sql = db();
  const rows = await sql`
    WITH request AS (
      UPDATE telegram_login_requests SET status = 'VERIFIED', telegram_id = ${profile.telegramId}, completion_hash = ${completionHash}, verified_at = now(), completion_expires_at = now() + interval '5 minutes'
      WHERE token_hash = ${tokenHash} AND status = 'PENDING' AND expires_at > now()
      RETURNING id
    ), account AS (
      INSERT INTO users (id, telegram_id, telegram_username, first_name, last_name, language_code, telegram_photo_url)
      SELECT ${newUserId}, ${profile.telegramId}, ${profile.username ?? null}, ${profile.firstName}, ${profile.lastName ?? null}, ${profile.languageCode ?? null}, ${profile.photoUrl ?? null}
      WHERE EXISTS (SELECT 1 FROM request)
      ON CONFLICT (telegram_id) DO UPDATE SET telegram_username = EXCLUDED.telegram_username, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, language_code = EXCLUDED.language_code, telegram_photo_url = COALESCE(EXCLUDED.telegram_photo_url, users.telegram_photo_url), updated_at = now(), last_login_at = now(), telegram_verified = true
      RETURNING id
    )
    UPDATE telegram_login_requests SET user_id = (SELECT id FROM account) WHERE id = (SELECT id FROM request) RETURNING id
  ` as { id: string }[];
  if (rows.length) return "VERIFIED";
  const status = await getTelegramLoginStatusByHash(tokenHash);
  return status === "EXPIRED" ? "EXPIRED" : "INVALID";
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
        AND (
          status = 'VERIFIED'
          OR (status = 'USED' AND used_at > now() - interval '30 seconds')
        )
      RETURNING user_id
    )
    SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, is_active AS "isActive", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users WHERE id = (SELECT user_id FROM completed)
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
  return await sql`SELECT id, telegram_id AS "telegramId", telegram_username AS "telegramUsername", first_name AS "firstName", last_name AS "lastName", telegram_photo_url AS "telegramPhotoUrl", role, is_active AS "isActive", created_at AS "createdAt", last_login_at AS "lastLoginAt" FROM users ORDER BY created_at DESC` as StoredUser[];
}

export type AppSettings = {
  siteName: string; siteDesc: string; maintenanceMode: boolean; registrationOpen: boolean;
  emailNotifications: boolean; pushNotifications: boolean; defaultLanguage: string;
  contentPerPage: string; maxUploadSize: string; watermarkEnabled: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  siteName: "UZDUB Play", siteDesc: "O'zbekistonning premium kino va serial platformasi",
  maintenanceMode: false, registrationOpen: true, emailNotifications: true, pushNotifications: false,
  defaultLanguage: "uz", contentPerPage: "24", maxUploadSize: "500", watermarkEnabled: true,
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
    UPDATE movies SET data = ${JSON.stringify(movie)}::jsonb, slug = ${movie.slug}
    WHERE id = ${id} RETURNING id
  `) as unknown[];
  return rows.length > 0;
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

export async function incrementEpisodeView(movieId: string, episodeId: string): Promise<number | null> {
  const movie = await getMovie(movieId);
  if (!movie?.episodes) return null;
  const episodes = movie.episodes.map((episode) => episode.id === episodeId ? { ...episode, viewCount: (episode.viewCount ?? 0) + 1 } : episode);
  await updateMovie(movieId, { ...movie, episodes });
  return episodes.find((episode) => episode.id === episodeId)?.viewCount ?? null;
}
