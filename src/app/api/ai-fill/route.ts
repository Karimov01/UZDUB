import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const runtime = "nodejs";

// Admin formadagi janr tugmalari bilan bir xil ro'yxat
const GENRES = [
  "Drama", "Harakatli", "Triller", "Ilmiy fantastika", "Fantastik", "Jinoyat",
  "Komediya", "Romantik", "Tarix", "Multfilm", "Dahshat", "Musiqa",
] as const;

// AI qaytaradigan tuzilma — barcha maydonlar majburiy (strict output)
const MovieInfo = z.object({
  description: z.string().describe("Film/serial haqida 2-3 jumlali batafsil tavsif, o'zbek tilida"),
  shortDesc: z.string().describe("Bir jumlali qisqa, jozibali tavsif (o'zbek tilida)"),
  type: z.enum(["MOVIE", "SERIAL", "CARTOON", "DOCUMENTARY"]).describe("Kontent turi"),
  country: z.string().describe("Ishlab chiqarilgan davlat, o'zbekcha (masalan: AQSh, Koreya)"),
  language: z.string().describe("Asl til, o'zbekcha (masalan: Ingliz, Koreys)"),
  dubbing: z.string().describe("Dublyaj tili, odatda: O'zbek"),
  duration: z.number().int().describe("Davomiyligi daqiqada (serial uchun bir epizod)"),
  imdbRating: z.number().describe("IMDb reytingi 0 dan 10 gacha (masalan 8.5)"),
  genres: z.array(z.enum(GENRES)).describe("Ushbu ro'yxatdan mos janrlar"),
});

// Oddiy, eng-yaxshi-harakat (best-effort) IP bo'yicha rate limit.
// Serverless muhitda instansiyalararo baham ko'rilmaydi — production uchun
// Upstash Redis (@upstash/redis o'rnatilgan) yoki auth bilan almashtiring.
const RATE_LIMIT = 8; // daqiqasiga so'rovlar
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  // Xotira o'sishining oldini olish
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE_LIMIT;
}

const clamp = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY sozlanmagan. .env.local fayliga kalitni qo'shing." },
      { status: 500 }
    );
  }

  // So'rov hajmini cheklash (katta payload'lardan himoya)
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) {
    return NextResponse.json({ error: "So'rov juda katta" }, { status: 413 });
  }

  // Rate limit (IP proxy sarlavhalaridan)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Juda ko'p so'rov. Bir daqiqadan so'ng qayta urinib ko'ring." },
      { status: 429 }
    );
  }

  let raw: { title?: unknown; originalTitle?: unknown; year?: unknown };
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  // Kirishlarni tozalash va cheklash
  const title = clamp(raw.title, 200);
  const originalTitle = clamp(raw.originalTitle, 200);
  const yearNum = Number(raw.year);
  const year = Number.isFinite(yearNum) && yearNum >= 1870 && yearNum <= 2100 ? String(yearNum) : "";

  if (!title && !originalTitle) {
    return NextResponse.json(
      { error: "Kamida nomi yoki asl nomini kiriting" },
      { status: 400 }
    );
  }

  const client = new Anthropic();

  const prompt = [
    "Sen kino ma'lumotlar bazasi bo'yicha ekspertsan. Quyidagi film yoki serial haqida ma'lumot ber.",
    "Barcha matnli maydonlarni O'ZBEK TILIDA to'ldir.",
    `Nomi: ${title || "(noma'lum)"}`,
    originalTitle ? `Asl nomi: ${originalTitle}` : "",
    year ? `Yili: ${year}` : "",
    "Agar aniq bilmasang, eng yaqin va ishonchli taxminni ber. Janrlarni faqat berilgan ro'yxatdan tanla.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { format: zodOutputFormat(MovieInfo) },
      messages: [{ role: "user", content: prompt }],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "AI so'rovni bajara olmadi" }, { status: 422 });
    }

    return NextResponse.json({ data: message.parsed_output });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI xatosi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
