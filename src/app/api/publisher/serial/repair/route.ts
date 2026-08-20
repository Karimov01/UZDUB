import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repairPublisherSerialEpisode } from "@/lib/publisher-service";
import { publisherBody, publisherFailure, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({
  contentId: z.string().trim().min(1).max(200), episodeId: z.string().trim().min(1).max(200),
  repairAi: z.boolean().optional().default(false), duration: z.number().int().min(1).max(100000).optional(),
  dryRun: z.boolean().optional().default(false),
}).strict();

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try {
    const result = await repairPublisherSerialEpisode(parsed.data);
    if (!parsed.data.dryRun && result.action === "updated") revalidatePath("/serial");
    return publisherJson(result);
  } catch (error) { return publisherFailure(error); }
}
