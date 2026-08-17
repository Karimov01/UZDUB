import { z } from "zod";
import { searchPublisherContent } from "@/lib/publisher-service";
import { publisherBody, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({ type: z.enum(["movie", "serial"]), title: z.string().trim().min(1).max(200), originalTitle: z.string().trim().max(200).optional(), year: z.coerce.number().int().min(1870).max(2100).optional() }).strict();

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  return publisherJson(await searchPublisherContent(parsed.data));
}
