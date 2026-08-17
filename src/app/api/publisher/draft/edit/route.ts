import { z } from "zod";
import { editPublisherDraft } from "@/lib/publisher-service";
import { isSafePublicVideoUrl, publisherBody, publisherFailure, publisherJson, unauthorizedPublisher } from "@/lib/publisher-http";

export const runtime = "nodejs";
const Input = z.object({
  contentId: z.string().trim().min(1).max(200), title: z.string().trim().min(1).max(200).optional(),
  originalTitle: z.string().trim().min(1).max(200).optional(), year: z.coerce.number().int().min(1870).max(2100).optional(),
  description: z.string().trim().min(1).max(10000).optional(),
  posterUrl: z.string().trim().url().max(2000).refine(isSafePublicVideoUrl).optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== "contentId"), "Change required");

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request); if (unauthorized) return unauthorized;
  const parsed = Input.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try { return publisherJson(await editPublisherDraft(parsed.data)); }
  catch (error) { return publisherFailure(error); }
}
