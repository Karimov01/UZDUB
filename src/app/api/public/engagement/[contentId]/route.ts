import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { getEngagement } from "@/lib/engagement-store";

export async function GET(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  const guestId = (await cookies()).get("guest_voter_id")?.value;
  const voterId = session?.user?.id && session.user.id !== "admin" ? `user:${session.user.id}` : guestId ? `guest:${createHash("sha256").update(guestId).digest("hex")}` : undefined;
  const sort = new URL(request.url).searchParams.get("sort") === "top" ? "top" : "latest";
  const offset = Math.max(0, Number(new URL(request.url).searchParams.get("offset") ?? 0));
  const data = await getEngagement(contentId, voterId, sort, offset);
  const isAuthenticated = Boolean(session?.user?.id && session.user.id !== "admin");
  return NextResponse.json({ ...data, canComment: true, canVote: true, isAuthenticated }, { headers: { "cache-control": "no-store" } });
}
