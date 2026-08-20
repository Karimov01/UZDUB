export type EpisodeAiInput = {
  serialTitle: string;
  originalTitle?: string;
  title?: string;
  season: number;
  episode: number;
};

export type EpisodeAiResult = { title: string; description: string; aiProcessedAt: string };

const clamp = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Shared backend implementation used by both the admin AI button and Publisher repair. */
export async function fillEpisodeMetadata(input: EpisodeAiInput): Promise<EpisodeAiResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY sozlanmagan.");
  const serialTitle = clamp(input.serialTitle, 200);
  const originalTitle = clamp(input.originalTitle, 200);
  const title = clamp(input.title, 200);
  if (!serialTitle && !originalTitle) throw new Error("Serial nomi kerak");
  const prompt = [
    `Serial: ${serialTitle || originalTitle}${originalTitle ? ` (asl nomi: ${originalTitle})` : ""}.`,
    `${input.season}-mavsum ${input.episode}-qism${title ? `: ${title}` : ""}.`,
    "Ushbu qism uchun JSON qaytar (O'ZBEK TILIDA, SEO uchun tabiiy):",
    '{ "title": "qism nomi (o\'zbekcha, qisqa va aniq)", "description": "2-3 jumlali o\'zbekcha SEO tavsif" }',
  ].join("\n");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://uzdub.com", "X-Title": "UZDUB Play",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Sen serial qismlari uchun professional o'zbek tarjimon va SEO mutaxassisisan. Faqat to'g'ri JSON qaytarasan." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }, max_tokens: 400, temperature: 0.5,
    }),
  });
  if (!response.ok) throw new Error("AI javob bermadi");
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  const parsed = content ? JSON.parse(content) : {};
  const result = { title: clamp(parsed.title, 200), description: clamp(parsed.description, 3000) };
  if (!result.title || !result.description) throw new Error("AI to'liq javob bermadi");
  return { ...result, aiProcessedAt: new Date().toISOString() };
}
