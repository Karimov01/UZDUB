import { revalidatePath } from "next/cache";
import { z } from "zod";
import { publishPublisherContent } from "@/lib/publisher-service";
import { publisherBody, publisherFailure, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({ contentId: z.string().trim().min(1).max(200) }).strict();

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try {
    const result = await publishPublisherContent(parsed.data.contentId);
    revalidatePath("/kino"); revalidatePath("/serial");
    revalidatePath(result.siteUrl.replace("https://uzdub.com", ""));
    return publisherJson(result);
  } catch (error) { return publisherFailure(error); }
}
