import { neon } from "@neondatabase/serverless";

const [id] = process.argv.slice(2);
if (!id || !process.env.DATABASE_URL) throw new Error("id and DATABASE_URL are required");
const sql = neon(process.env.DATABASE_URL);
const rows = await sql.query("SELECT data FROM movies WHERE id = $1 LIMIT 1", [id]);
const movie = rows[0]?.data;
console.log(JSON.stringify({
  found: Boolean(movie),
  title: movie?.title,
  originalTitle: movie?.originalTitle,
  year: movie?.year,
  status: movie?.status,
  hasDescription: Boolean(movie?.description),
  descriptionLength: movie?.description?.length ?? 0,
  hasPoster: Boolean(movie?.posterUrl),
  hasVideo: Boolean(movie?.videoUrl),
  videoHttps: movie?.videoUrl?.startsWith("https://") ?? false,
  genres: movie?.genres?.length ?? 0,
  seoTitle: movie?.seoTitle,
}, null, 2));
