import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserListIds, toggleUserListItem } from "@/lib/movies-store";

type ListType = "FAVORITE" | "WATCH_LATER";
function typeOf(value: string | null): ListType | undefined { return value === "FAVORITE" || value === "WATCH_LATER" ? value : undefined; }

export async function GET(request: Request) {
  const session = await auth(); const userId = session?.user?.id; const type = typeOf(new URL(request.url).searchParams.get("type"));
  if (!userId) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
  if (!type) return NextResponse.json({ error: "Ro'yxat turi noto'g'ri" }, { status: 400 });
  return NextResponse.json({ ids: await getUserListIds(userId, type) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await auth(); const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
  const body = await request.json().catch(() => null) as { movieId?: unknown; type?: unknown } | null;
  const movieId = typeof body?.movieId === "string" ? body.movieId : ""; const type = typeOf(typeof body?.type === "string" ? body.type : null);
  if (!movieId || !type) return NextResponse.json({ error: "Ma'lumot noto'g'ri" }, { status: 400 });
  return NextResponse.json({ saved: await toggleUserListItem(userId, movieId, type) }, { headers: { "Cache-Control": "private, no-store" } });
}
