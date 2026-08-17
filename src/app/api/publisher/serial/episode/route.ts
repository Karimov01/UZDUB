import { revalidatePath } from "next/cache";
import { z } from "zod";
import { upsertPublisherEpisode } from "@/lib/publisher-service";
import {
  publisherBody,
  publisherFailure,
  publisherJson,
  publisherVideoInput,
  unauthorizedPublisher,
} from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = publisherVideoInput.extend({
  season: z.coerce.number().int().min(1).max(100).optional().default(1),
  episode: z.coerce.number().int().min(1).max(1000),
});

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request);
  if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try {
    const result = await upsertPublisherEpisode(parsed.data);
    revalidatePath("/serial");
    revalidatePath("/yangi-qismlar");
    revalidatePath(`/serial/${result.slug}`);
    revalidatePath(`/serial/${result.slug}/qism/${result.season}/${result.episode}`);
    return publisherJson(result);
  } catch (error) {
    return publisherFailure(error);
  }
}
