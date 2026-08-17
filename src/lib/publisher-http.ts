import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { z } from "zod";
import { isPublisherAuthorized } from "@/lib/publisher-auth";
import { PublisherError } from "@/lib/publisher-service";

export const publisherIdentityInput = z.object({
  type: z.enum(["movie", "serial"]),
  title: z.string().trim().min(1).max(200),
  originalTitle: z.string().trim().min(1).max(200),
  year: z.coerce.number().int().min(1870).max(2100),
}).strict();

const httpsUrl = z.string().trim().url().refine(isSafePublicVideoUrl, "Xavfsiz public HTTP(S) URL kerak").max(2000).nullish();

export const publisherVideoInput = z.object({
  contentId: z.string().trim().min(1).max(200),
  moverWatchUrl: httpsUrl,
  moverEmbedUrl: httpsUrl,
  publicUrl: httpsUrl,
}).strict().refine(
  (value) => Boolean(value.moverWatchUrl || value.moverEmbedUrl || value.publicUrl),
  { message: "Kamida bitta video URL majburiy" },
);

export function unauthorizedPublisher(request: Request): NextResponse | null {
  return isPublisherAuthorized(request) ? null : publisherJson({ error: "UNAUTHORIZED" }, 401);
}

export function publisherJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function publisherFailure(error: unknown): NextResponse {
  if (error instanceof PublisherError) {
    return publisherJson({ error: error.code }, error.status);
  }
  return publisherJson({ error: "INTERNAL_ERROR" }, 500);
}

export async function publisherBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

export function isSafePublicVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "metadata.google.internal") return false;
    if (isIP(host) === 4) {
      const parts = host.split(".").map(Number);
      if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)) return false;
    }
    if (isIP(host) === 6 && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:"))) return false;
    return true;
  } catch {
    return false;
  }
}
