import { validBearer } from "@/lib/ai-office-contract";

export function isPublisherAuthorized(request: Request): boolean {
  return validBearer(
    request.headers.get("authorization"),
    process.env.PUBLISHER_API_TOKEN,
  );
}
