import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const optionalUrl = z.string().trim().url().refine((value) => value.startsWith("https://"), "URL HTTPS bo'lishi kerak").max(2000).optional();

export const AiOfficeDraftInput = z.discriminatedUnion("contentType", [
  z.object({
    contentType: z.enum(["MOVIE", "SERIES"]), title: z.string().trim().min(1).max(200), originalTitle: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).default(""), shortDescription: z.string().trim().max(500).optional(), year: z.number().int().min(1870).max(2100),
    duration: z.number().int().min(0).max(100000).optional(), country: z.string().trim().max(100).optional(), language: z.string().trim().max(100).optional(),
    posterUrl: optionalUrl, backdropUrl: optionalUrl, playerUrl: optionalUrl, trailerUrl: optionalUrl, genres: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    isFeatured: z.boolean().default(false), isTrending: z.boolean().default(false), isPremium: z.boolean().default(false),
  }).strict(),
  z.object({
    contentType: z.literal("EPISODE"), parentSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), season: z.number().int().min(1).max(100), episode: z.number().int().min(1).max(1000),
    title: z.string().trim().min(1).max(200), description: z.string().trim().max(3000).optional(), playerUrl: optionalUrl, duration: z.number().int().min(0).max(100000).optional(),
  }).strict(),
]);

export type AiOfficeDraft = z.infer<typeof AiOfficeDraftInput>;
export function payloadHash(payload: AiOfficeDraft): string { return createHash("sha256").update(JSON.stringify(payload)).digest("hex"); }
export function validBearer(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7)), expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
