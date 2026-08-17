import { findPublisherContent } from "@/lib/publisher-service";
import {
  publisherBody,
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
      status: "not_found",
      requiredFields: ["title", "originalTitle", "year"],
    }, 400);
  }
  return publisherJson(await findPublisherContent(parsed.data));
}
