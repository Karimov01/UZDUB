import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEngagement } from "@/lib/engagement-store";

export async function GET(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  const voterId = session?.user?.id ? `user:${session.user.id}` : undefined;
  const sort = new URL(request.url).searchParams.get("sort") === "top" ? "top" : "latest";
  const offset = Math.max(0, Number(new URL(request.url).searchParams.get("offset") ?? 0));
  const data = await getEngagement(contentId, voterId, sort, offset);
  return NextResponse.json({ ...data, canComment: Boolean(session?.user?.id) }, { headers: { "cache-control": "no-store" } });
}
