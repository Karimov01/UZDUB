import { revalidatePath } from "next/cache";
import { createPublisherContent } from "@/lib/publisher-service";
import {
  publisherBody,
  publisherFailure,
  publisherIdentityInput,
  publisherJson,
  unauthorizedPublisher,
} from "@/lib/publisher-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = unauthorizedPublisher(request);
  if (unauthorized) return unauthorized;
  const parsed = publisherIdentityInput.safeParse(await publisherBody(request));
  if (!parsed.success) {
    return publisherJson({
      error: "VALIDATION_ERROR",
      requiredFields: ["title", "originalTitle", "year"],
    }, 400);
  }
  try {
    const result = await createPublisherContent(parsed.data);
    if (result.status === "multiple_matches") return publisherJson(result, 409);
    if (result.status === "found") return publisherJson(result, 200);
    revalidatePath("/admin/kinolar");
    revalidatePath(parsed.data.type === "serial" ? "/serial" : "/kino");
    return publisherJson(result, 201);
  } catch (error) {
    return publisherFailure(error);
  }
}
