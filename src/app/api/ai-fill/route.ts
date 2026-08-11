import { NextResponse } from "next/server";
import { fillMovieMetadata } from "@/lib/ai-movie-fill";

export const runtime = "nodejs";

const RATE_LIMIT = 12;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > RATE_LIMIT;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Juda ko'p so'rov. Bir daqiqadan so'ng urinib ko'ring." },
      { status: 429 },
    );
  }

  const raw = (await request.json().catch(() => null)) as {
    title?: unknown;
    originalTitle?: unknown;
    year?: unknown;
    type?: unknown;
  } | null;
  const title = typeof raw?.title === "string" ? raw.title.trim().slice(0, 200) : "";
  const originalTitle =
    typeof raw?.originalTitle === "string" ? raw.originalTitle.trim().slice(0, 200) : "";
  const year = Number(raw?.year);
  const type = raw?.type === "SERIAL" ? "SERIAL" : "MOVIE";

  if (!title || !originalTitle || !Number.isInteger(year) || year < 1870 || year > 2100) {
    return NextResponse.json(
      { error: "O'zbekcha nom, asl nom va yil majburiy" },
      { status: 400 },
    );
  }

  try {
    const data = await fillMovieMetadata({ title, originalTitle, year, type });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "AI ma'lumot topolmadi. Keyinroq urinib ko'ring." },
      { status: 502 },
    );
  }
}
