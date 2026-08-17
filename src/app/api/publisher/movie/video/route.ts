import { revalidatePath } from "next/cache";
import { updatePublisherMovieVideo } from "@/lib/publisher-service";
import {
  publisherBody,
  publisherFailure,
  publisherJson,
  publisherVideoInput,
  unauthorizedPublisher,
} from "@/lib/publisher-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request);
  if (unauthorized) return unauthorized;
  const parsed = publisherVideoInput.safeParse(await publisherBody(request));
  if (!parsed.success) return publisherJson({ error: "VALIDATION_ERROR" }, 400);
  try {
    const result = await updatePublisherMovieVideo(parsed.data);
    revalidatePath("/kino");
    revalidatePath(`/kino/${result.slug}`);
    revalidatePath(`/kino/${result.slug}/tomosha`);
    return publisherJson({
      success: result.success,
      action: result.action,
      contentId: result.contentId,
    });
  } catch (error) {
    return publisherFailure(error);
  }
}
