import { revalidatePath } from "next/cache";
import { z } from "zod";
import { undoPublisherPlayer } from "@/lib/publisher-service";
import { publisherBody, publisherFailure, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({ historyId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try {
    const result = await undoPublisherPlayer(parsed.data.historyId);
    revalidatePath("/kino"); revalidatePath("/serial"); revalidatePath(result.siteUrl.replace("https://uzdub.com", ""));
    return publisherJson(result);
  } catch (error) { return publisherFailure(error); }
}
