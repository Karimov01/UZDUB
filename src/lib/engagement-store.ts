import { neon } from "@neondatabase/serverless";

const db = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL sozlanmagan");
  return neon(process.env.DATABASE_URL);
};

let ready: Promise<void> | null = null;
async function ensureEngagementTables() {
  if (!ready) {
    const sql = db();
    ready = (async () => {
      await Promise.all([
        sql`CREATE TABLE IF NOT EXISTS content_ratings (content_id TEXT NOT NULL, voter_id TEXT NOT NULL, score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 10), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (content_id, voter_id))`,
        sql`CREATE TABLE IF NOT EXISTS content_reactions (content_id TEXT NOT NULL, voter_id TEXT NOT NULL, reaction TEXT NOT NULL CHECK (reaction IN ('LIKE', 'DISLIKE')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (content_id, voter_id))`,
        sql`CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, content_id TEXT NOT NULL, user_id TEXT NOT NULL, parent_id TEXT, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
        sql`CREATE TABLE IF NOT EXISTS comment_likes (comment_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (comment_id, user_id))`,
      ]);
      await Promise.all([
        sql`CREATE INDEX IF NOT EXISTS comments_content_created_idx ON comments (content_id, created_at DESC)`,
        sql`CREATE INDEX IF NOT EXISTS comment_likes_comment_idx ON comment_likes (comment_id)`,
      ]);
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'APPROVED'`;
      await sql`ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'APPROVED'`;
    })();
  }
  return ready;
}

export type EngagementComment = { id: string; body: string; parentId?: string; createdAt: string; firstName: string; lastName?: string; telegramUsername?: string; telegramPhotoUrl?: string; role: string; likes: number; likedByMe: boolean };

export async function getEngagement(contentId: string, voterId?: string, sort: "latest" | "top" = "latest", offset = 0) {
  await ensureEngagementTables(); const sql = db();
  const ratings = await sql`SELECT COALESCE(AVG(score), 0)::float AS average, COUNT(*)::int AS count, COALESCE(MAX(score) FILTER (WHERE voter_id = ${voterId ?? ""}), 0)::int AS "myScore" FROM content_ratings WHERE content_id = ${contentId}` as unknown as { average: number; count: number; myScore: number }[];
  const reactions = await sql`SELECT COUNT(*) FILTER (WHERE reaction = 'LIKE')::int AS likes, COUNT(*) FILTER (WHERE reaction = 'DISLIKE')::int AS dislikes, COALESCE(MAX(reaction) FILTER (WHERE voter_id = ${voterId ?? ""}), '') AS "myReaction" FROM content_reactions WHERE content_id = ${contentId}` as unknown as { likes: number; dislikes: number; myReaction: "LIKE" | "DISLIKE" | "" }[];
  const comments = sort === "top"
    ? await sql`SELECT c.id, c.body, c.parent_id AS "parentId", c.created_at AS "createdAt", u.first_name AS "firstName", u.last_name AS "lastName", u.telegram_username AS "telegramUsername", u.telegram_photo_url AS "telegramPhotoUrl", u.role, COUNT(cl.comment_id)::int AS likes, BOOL_OR(cl.user_id = ${voterId ?? ""}) AS "likedByMe" FROM comments c JOIN users u ON u.id = c.user_id LEFT JOIN comment_likes cl ON cl.comment_id = c.id WHERE c.content_id = ${contentId} AND c.status = 'APPROVED' GROUP BY c.id, u.id ORDER BY COUNT(cl.comment_id) DESC, c.created_at DESC LIMIT 10 OFFSET ${offset}` as unknown as EngagementComment[]
    : await sql`SELECT c.id, c.body, c.parent_id AS "parentId", c.created_at AS "createdAt", u.first_name AS "firstName", u.last_name AS "lastName", u.telegram_username AS "telegramUsername", u.telegram_photo_url AS "telegramPhotoUrl", u.role, COUNT(cl.comment_id)::int AS likes, BOOL_OR(cl.user_id = ${voterId ?? ""}) AS "likedByMe" FROM comments c JOIN users u ON u.id = c.user_id LEFT JOIN comment_likes cl ON cl.comment_id = c.id WHERE c.content_id = ${contentId} AND c.status = 'APPROVED' GROUP BY c.id, u.id ORDER BY c.created_at DESC LIMIT 10 OFFSET ${offset}` as unknown as EngagementComment[];
  const totals = await sql`SELECT COUNT(*)::int AS total FROM comments WHERE content_id = ${contentId} AND status = 'APPROVED'` as unknown as { total: number }[];
  return { rating: ratings[0] ?? { average: 0, count: 0, myScore: 0 }, reaction: reactions[0] ?? { likes: 0, dislikes: 0, myReaction: "" }, comments, totalComments: totals[0]?.total ?? 0 };
}

export async function saveRating(contentId: string, voterId: string, score: number) {
  await ensureEngagementTables(); const sql = db();
  await sql`INSERT INTO content_ratings (content_id, voter_id, score) VALUES (${contentId}, ${voterId}, ${score}) ON CONFLICT (content_id, voter_id) DO UPDATE SET score = EXCLUDED.score, updated_at = now()`;
}

export async function saveReaction(contentId: string, voterId: string, reaction: "LIKE" | "DISLIKE") {
  await ensureEngagementTables(); const sql = db();
  await sql`INSERT INTO content_reactions (content_id, voter_id, reaction) VALUES (${contentId}, ${voterId}, ${reaction}) ON CONFLICT (content_id, voter_id) DO UPDATE SET reaction = EXCLUDED.reaction, updated_at = now()`;
}

export async function createComment(id: string, contentId: string, userId: string, body: string, parentId?: string) {
  await ensureEngagementTables(); const sql = db();
  await sql`INSERT INTO comments (id, content_id, user_id, parent_id, body) VALUES (${id}, ${contentId}, ${userId}, ${parentId ?? null}, ${body})`;
}

export async function toggleCommentLike(commentId: string, userId: string) {
  await ensureEngagementTables(); const sql = db();
  const inserted = await sql`INSERT INTO comment_likes (comment_id, user_id) VALUES (${commentId}, ${userId}) ON CONFLICT DO NOTHING RETURNING comment_id` as unknown[];
  if (inserted.length) return true;
  await sql`DELETE FROM comment_likes WHERE comment_id = ${commentId} AND user_id = ${userId}`;
  return false;
}

export type AdminComment = EngagementComment & { contentTitle?: string; status: "PENDING" | "APPROVED" | "SPAM" };
export async function getAdminComments(query: string, status: string, page: number) {
  await ensureEngagementTables(); const sql = db(); const offset = (page - 1) * 20; const term = `%${query}%`;
  const rows = await sql`SELECT c.id, c.body, c.parent_id AS "parentId", c.created_at AS "createdAt", c.status, u.first_name AS "firstName", u.last_name AS "lastName", u.telegram_username AS "telegramUsername", u.telegram_photo_url AS "telegramPhotoUrl", u.role, COALESCE(m.data->>'title', 'Kontent topilmadi') AS "contentTitle", COUNT(cl.comment_id)::int AS likes, false AS "likedByMe" FROM comments c JOIN users u ON u.id = c.user_id LEFT JOIN movies m ON m.id = c.content_id LEFT JOIN comment_likes cl ON cl.comment_id = c.id WHERE c.status <> 'DELETED' AND (${status} = 'ALL' OR c.status = ${status}) AND (${query} = '' OR c.body ILIKE ${term} OR COALESCE(u.telegram_username, '') ILIKE ${term}) GROUP BY c.id, u.id, m.data ORDER BY c.created_at DESC LIMIT 20 OFFSET ${offset}` as unknown as AdminComment[];
  const counts = await sql`SELECT COUNT(*) FILTER (WHERE status <> 'DELETED')::int AS total, COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved, COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending, COUNT(*) FILTER (WHERE status = 'SPAM')::int AS spam FROM comments` as unknown as { total:number; approved:number; pending:number; spam:number }[];
  return { comments: rows, stats: counts[0] ?? { total:0, approved:0, pending:0, spam:0 } };
}
export async function moderateComments(ids: string[], status: "PENDING" | "APPROVED" | "SPAM" | "DELETED") {
  await ensureEngagementTables(); const sql = db();
  for (const id of ids) {
    if (status === "DELETED") {
      await sql`WITH RECURSIVE tree AS (SELECT id FROM comments WHERE id = ${id} UNION ALL SELECT c.id FROM comments c JOIN tree t ON c.parent_id = t.id) DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM tree)`;
      await sql`WITH RECURSIVE tree AS (SELECT id FROM comments WHERE id = ${id} UNION ALL SELECT c.id FROM comments c JOIN tree t ON c.parent_id = t.id) DELETE FROM comments WHERE id IN (SELECT id FROM tree)`;
    } else await sql`UPDATE comments SET status = ${status}, updated_at = now() WHERE id = ${id}`;
  }
}
