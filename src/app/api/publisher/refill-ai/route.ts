import { z } from "zod";
import { refillPublisherAi } from "@/lib/publisher-service";
import { publisherBody, publisherFailure, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({ contentId: z.string().trim().min(1).max(200), preserveFields: z.array(z.enum([
  "title", "originalTitle", "year", "description", "shortDesc", "posterUrl", "backdropUrl", "duration",
  "country", "language", "dubbing", "imdbRating", "genres", "videoUrl",
])).max(20).optional() }).strict();

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try { return publisherJson(await refillPublisherAi(parsed.data)); }
  catch (error) { return publisherFailure(error); }
}
