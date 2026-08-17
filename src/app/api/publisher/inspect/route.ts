import { z } from "zod";
import { inspectPublisherContent } from "@/lib/publisher-service";
import { publisherBody, publisherFailure, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({ contentId: z.string().trim().min(1).max(200), season: z.coerce.number().int().min(1).max(100).optional(), episode: z.coerce.number().int().min(1).max(1000).optional() }).strict();

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try { return publisherJson(await inspectPublisherContent(parsed.data)); }
  catch (error) { return publisherFailure(error); }
}
