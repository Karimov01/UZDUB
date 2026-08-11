import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
const [draftId, adminId] = process.argv.slice(2); if (!draftId || !/^\d+$/.test(adminId ?? "") || !process.env.DATABASE_URL) throw new Error("draftId, adminId and DATABASE_URL are required");
const nonce = randomBytes(18).toString("base64url"), tokenHash = createHash("sha256").update(nonce).digest("hex"), sql = neon(process.env.DATABASE_URL);
await sql.query("CREATE TABLE IF NOT EXISTS ai_office_publish_approvals (token_hash TEXT PRIMARY KEY, draft_id TEXT NOT NULL, admin_id BIGINT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
await sql.query("INSERT INTO ai_office_publish_approvals (token_hash,draft_id,admin_id,expires_at) VALUES ($1,$2,$3,now() + interval '24 hours')", [tokenHash, draftId, Number(adminId)]);
console.log(nonce);
