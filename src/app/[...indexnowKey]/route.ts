import { NextResponse } from "next/server";

/** IndexNow kalitini public TXT fayl sifatida beradi: /{INDEXNOW_KEY}.txt */
export async function GET(_request: Request, { params }: { params: Promise<{ indexnowKey: string[] }> }) {
  const { indexnowKey } = await params;
  const key = process.env.INDEXNOW_KEY;
  if (!key || indexnowKey.length !== 1 || indexnowKey[0] !== `${key}.txt`) return new NextResponse("Topilmadi", { status: 404 });
  return new NextResponse(key, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
