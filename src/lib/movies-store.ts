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
    ready = sql`
      CREATE TABLE IF NOT EXISTS movies (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
  }
  return ready;
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
