import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toggleCommentLike } from "@/lib/engagement-store";

export async function POST(_request: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.id === "admin") return NextResponse.json({ error: "Izohni yoqtirish uchun Telegram orqali kiring." }, { status: 401 });
  const { commentId } = await params;
  return NextResponse.json({ liked: await toggleCommentLike(commentId, session.user.id) });
}
