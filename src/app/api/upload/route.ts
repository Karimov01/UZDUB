import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

// R2 sozlangan bo'lsa uni ishlatamiz; aks holda lokal (dev) papka
function r2Config() {
  const id = process.env.R2_ACCOUNT_ID;
  const key = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!id || !key || !secret || !bucket) return null;
  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${id}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: key, secretAccessKey: secret },
    }),
    bucket,
    publicUrl: (process.env.R2_PUBLIC_URL || "https://cdn.uzdub.com").replace(/\/$/, ""),
  };
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Faqat rasm fayllari (JPG, PNG, WebP, AVIF, GIF)" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fayl 8MB dan katta" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  // --- Cloudflare R2 (production) ---
  const r2 = r2Config();
  if (r2) {
    const key = `Uzdub_play_Data/${filename}`;
    try {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      return NextResponse.json({ error: `R2 ga yuklashda xatolik. ${msg}`.trim() }, { status: 500 });
    }
    return NextResponse.json({ url: `${r2.publicUrl}/${key}` });
  }

  // --- Lokal fayl tizimi (faqat dev; Vercel'da ishlamaydi) ---
  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  } catch {
    return NextResponse.json(
      { error: "Rasmni saqlab bo'lmadi. Production'da R2 sozlang (R2_ACCOUNT_ID va h.k.)." },
      { status: 500 }
    );
  }
  return NextResponse.json({ url: `/uploads/${filename}` });
}
