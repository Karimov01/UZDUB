import { NextResponse } from "next/server";
import { z } from "zod";
import { isPublisherAuthorized } from "@/lib/publisher-auth";
import { PublisherError } from "@/lib/publisher-service";

export const publisherIdentityInput = z.object({
  type: z.enum(["movie", "serial"]),
  title: z.string().trim().min(1).max(200),
  originalTitle: z.string().trim().min(1).max(200),
  year: z.coerce.number().int().min(1870).max(2100),
}).strict();

const httpsUrl = z.string().trim().url().refine(
  (value) => value.startsWith("https://"),
  "URL HTTPS bo'lishi kerak",
).max(2000).nullish();

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
