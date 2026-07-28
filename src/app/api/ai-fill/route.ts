import { NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/tmdb";

export const runtime = "nodejs";

const GENRES = [
  "Drama", "Harakatli", "Triller", "Ilmiy fantastika", "Fantastik", "Jinoyat",
  "Komediya", "Romantik", "Tarix", "Multfilm", "Dahshat", "Musiqa",
];

// Best-effort IP rate limit
const RATE_LIMIT = 12;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE_LIMIT;
}

const clamp = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

async function askOpenRouter(prompt: string): Promise<Record<string, unknown> | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://uzdub.com",
      "X-Title": "UZDUB Play",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Sen kino ma'lumotlar eksperti va professional o'zbek tarjimonisan. Faqat to'g'ri JSON qaytarasan." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 900,
      temperature: 0.5,
    }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Juda ko'p so'rov. Bir daqiqadan so'ng urinib ko'ring." }, { status: 429 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY sozlanmagan (.env.local)." }, { status: 500 });
  }

  let raw: { title?: unknown; originalTitle?: unknown; year?: unknown; type?: unknown };
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const title = clamp(raw.title, 200);
  const originalTitle = clamp(raw.originalTitle, 200);
  const type = clamp(raw.type, 20) || "MOVIE";
  const yearNum = Number(raw.year);
  const year = Number.isFinite(yearNum) && yearNum >= 1870 && yearNum <= 2100 ? String(yearNum) : "";
  if (!title && !originalTitle) {
    return NextResponse.json({ error: "Kamida nomi yoki asl nomini kiriting" }, { status: 400 });
  }

  // 1) TMDB — real ma'lumot va poster (asl nomdan afzal qidiramiz)
  const tmdb = await fetchTmdb(originalTitle || title, year, type);

  // 2) OpenRouter — o'zbekcha tavsif, SEO va janrlarni moslashtirish
  const prompt = [
    `Film/serial: ${title || originalTitle}${year ? ` (${year})` : ""}${originalTitle ? ` — asl nomi: ${originalTitle}` : ""}.`,
    tmdb.found
      ? `TMDB ma'lumoti (inglizcha):\nSyujet: ${tmdb.overview}\nJanrlar: ${(tmdb.genres || []).join(", ")}\nDavlat: ${tmdb.country}\nTil: ${tmdb.language}`
      : "TMDB'da topilmadi — o'z bilimingdan foydalanib to'ldir.",
    "",
    "Quyidagi JSON'ni QAYTAR (barcha matn O'ZBEK TILIDA, SEO uchun boy va tabiiy):",
    "{",
    '  "description": "2-4 jumlali batafsil, SEO-optimallashtirilgan o\'zbekcha tavsif (kalit so\'zlar tabiiy joylashtirilgan)",',
    '  "shortDesc": "1 jumlali qisqa, jozibali o\'zbekcha tavsif",',
    `  "genres": ["faqat shu ro'yxatdan mos janrlar: ${GENRES.join(", ")}"],`,
    '  "country": "o\'zbekcha davlat nomi (masalan: AQSh, Janubiy Koreya)",',
    '  "language": "o\'zbekcha til nomi (masalan: Ingliz, Koreys)"',
    "}",
  ].join("\n");

  const ai = await askOpenRouter(prompt);
  if (!ai) {
    return NextResponse.json({ error: "AI javob bermadi. Keyinroq urinib ko'ring." }, { status: 502 });
  }

  const aiGenres = Array.isArray(ai.genres) ? (ai.genres as string[]).filter((g) => GENRES.includes(g)) : [];

  const data = {
    description: typeof ai.description === "string" ? ai.description : "",
    shortDesc: typeof ai.shortDesc === "string" ? ai.shortDesc : "",
    genres: aiGenres,
    country: typeof ai.country === "string" ? ai.country : tmdb.country || "",
    language: typeof ai.language === "string" ? ai.language : tmdb.language || "",
    dubbing: "O'zbek",
    type,
    // TMDB'dan real qiymatlar
    duration: tmdb.runtime ?? undefined,
    imdbRating: tmdb.rating ?? undefined,
    posterUrl: tmdb.posterUrl ?? undefined,
    backdropUrl: tmdb.backdropUrl ?? undefined,
    tmdbFound: tmdb.found,
  };

  return NextResponse.json({ data });
}
