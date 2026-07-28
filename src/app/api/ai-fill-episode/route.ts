import { NextResponse } from "next/server";

export const runtime = "nodejs";

const clamp = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY sozlanmagan." }, { status: 500 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const serialTitle = clamp(raw.serialTitle, 200);
  const originalTitle = clamp(raw.originalTitle, 200);
  const title = clamp(raw.title, 200);
  const season = Number(raw.season) || 1;
  const episode = Number(raw.episode) || 1;
  if (!serialTitle && !originalTitle) {
    return NextResponse.json({ error: "Serial nomi kerak" }, { status: 400 });
  }

  const prompt = [
    `Serial: ${serialTitle || originalTitle}${originalTitle ? ` (asl nomi: ${originalTitle})` : ""}.`,
    `${season}-mavsum ${episode}-qism${title ? `: ${title}` : ""}.`,
    "Ushbu qism uchun JSON qaytar (O'ZBEK TILIDA, SEO uchun tabiiy):",
    '{ "title": "qism nomi (o\'zbekcha, qisqa va aniq)", "description": "2-3 jumlali o\'zbekcha SEO tavsif" }',
  ].join("\n");

  try {
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
          { role: "system", content: "Sen serial qismlari uchun professional o'zbek tarjimon va SEO mutaxassisisan. Faqat to'g'ri JSON qaytarasan." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.5,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "AI javob bermadi" }, { status: 502 });
    const j = await res.json();
    const content = j.choices?.[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};
    return NextResponse.json({
      data: {
        title: typeof parsed.title === "string" ? parsed.title : "",
        description: typeof parsed.description === "string" ? parsed.description : "",
      },
    });
  } catch {
    return NextResponse.json({ error: "AI xatosi" }, { status: 500 });
  }
}
