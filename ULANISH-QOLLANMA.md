# UZDUB Play — Serverga va API'larga ulash qo'llanmasi

Bu qo'llanma saytni ishga tushirish, AI'ni ulash, admin login, video/rasm
saqlash va Google/Yandex'da yuqoriga chiqishning barcha qadamlarini o'z ichiga
oladi.

---

## 0. Hozir nima tayyor

- ✅ **SEO 100%** — `robots.txt`, `sitemap.xml`, `manifest`, har bir kino/serial
  uchun Open Graph + Twitter Card + canonical + schema.org (Movie/TVSeries).
- ✅ **AI avtomatik to'ldirish** — "AI bilan to'ldirish": nomi + yili + asl nomi →
  qolgan hammasi avtomatik (Claude).
- ✅ **Video havolasi** maydoni (asosiy video + treyler).
- ✅ **Poster/backdrop kompyuterdan yuklash** — real `/api/upload` endpoint,
  fayl `public/uploads/` ga saqlanadi.
- ✅ **Admin panel PAROL bilan himoyalangan** (next-auth). `/admin` va API'lar
  login talab qiladi.
- ✅ **"Saqlash" ishlaydi** — kino lokal bazaga (JSON) yoziladi va ro'yxatda
  ko'rinadi.

---

## 1. Muhit o'zgaruvchilari (.env.local)

`.env.local` allaqachon yaratilgan. Ochib, kerakli qiymatlarni yozing:

| O'zgaruvchi | Nima uchun | Eslatma |
|---|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin panelga kirish | **Albatta o'zgartiring!** Default: `admin@uzdub.com` / `Admin12345!` |
| `AUTH_SECRET` | Sessiya himoyasi | Avtomatik generatsiya qilingan (tegmang) |
| `ANTHROPIC_API_KEY` | AI to'ldirish | https://console.anthropic.com → API Keys |
| `NEXT_PUBLIC_SITE_URL` | SEO (sitemap, canonical) | Real domeningiz |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` / `..._YANDEX_..` | Tasdiqlash | 4-bo'lim (deploydan keyin) |

So'ng: `npm run dev`. `/admin` ga kirsangiz login so'raydi.

---

## 2. Admin panel logini

- `/admin` ga kirsangiz avtomatik `/admin/login` ga yo'naltiradi.
- `.env.local` dagi `ADMIN_EMAIL` / `ADMIN_PASSWORD` bilan kiring.
- Sidebar pastidagi **"Chiqish"** tugmasi sessiyani tugatadi.
- `/api/ai-fill`, `/api/upload`, `/api/movies` — hammasi login talab qiladi (401).

> Bir nechta admin yoki foydalanuvchi rollari kerak bo'lsa — `next-auth` ga
> foydalanuvchi bazasi (Prisma) qo'shiladi (keyingi bosqich).

---

## 3. AI, rasm va video (tayyor)

- **AI**: `src/app/api/ai-fill/route.ts` — Claude (`claude-opus-5`). Faqat
  `ANTHROPIC_API_KEY` ni qo'ysangiz ishlaydi.
- **Rasm**: kompyuterdan tanlaysiz → `/api/upload` ga yuklanadi →
  `public/uploads/` da saqlanadi. Faqat rasm, ≤ 8MB.
- **Video**: `videoUrl` maydoniga havola. HLS (`.m3u8`) — sayt `hls.js` bilan
  jihozlangan; MP4 ham bo'ladi. Hosting: Bunny Stream, Cloudflare Stream, S3/CDN.

---

## 4. Google va Yandex'da yuqoriga chiqish (deploydan keyin)

**Google Search Console** — https://search.google.com/search-console
1. Domeningizni qo'shing → "HTML tag" usuli → `content="..."` ni
   `NEXT_PUBLIC_GOOGLE_VERIFICATION` ga → qayta deploy.
2. "Sitemaps" → `sitemap.xml` yuboring.

**Yandex Webmaster** — https://webmaster.yandex.com
1. Saytni qo'shing → meta-tag → `NEXT_PUBLIC_YANDEX_VERIFICATION`.
2. "Файлы Sitemap" → `https://domen/sitemap.xml`.

---

## 5. Serverga chiqarish (Deploy)

### Vercel (tavsiya)
1. Kodni GitHub'ga yuklang.
2. https://vercel.com → New Project → repo.
3. **Environment Variables**: `.env.local` dagi HAMMA kalitni qo'shing
   (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`,
   `NEXT_PUBLIC_SITE_URL`).
4. Deploy → domenni ulang.

⚠️ **Vercel'da fayl tizimi vaqtinchalik** — yuklangan rasmlar va JSON saqlash
saqlanmaydi. Production'da 6-7 bo'limga o'ting.

### VPS
```bash
npm run build && npm run start   # 3000-port; oldiga Nginx + domen
```
VPS'da `public/uploads/` va `data/` doimiy qoladi (Vercel'dan farqli).

---

## 6. Rasmni production storage'ga (Vercel uchun)

`public/uploads/` Vercel'da ishlamaydi. `src/app/api/upload/route.ts` ni
almashtiring:
- **Vercel Blob**: `npm i @vercel/blob` → `put(filename, file, {access:'public'})`
  → qaytgan URL'ni ishlating.
- **Cloudinary** / **AWS S3** — universal.

So'ng `next.config.ts` → `images.remotePatterns` ga yangi host qo'shing.

---

## 7. Doimiy baza (JSON → PostgreSQL)

Hozir saqlash lokal JSON orqali (`src/lib/movies-store.ts`, `data/movies.json`)
— akkauntsiz, Windows'da ishlaydi. Production uchun Prisma + PostgreSQL:
1. DB oling (Neon, Supabase yoki Vercel Postgres).
2. `prisma/schema.prisma` tayyor (Movie modeli). Prisma 7 da ulanish URL'i
   `prisma.config.ts` da beriladi (https://pris.ly/d/config-datasource).
3. `npx prisma migrate dev` → `npx prisma generate`.
4. `src/app/api/movies/route.ts` dagi JSON store'ni Prisma client bilan
   almashtiring (GET/POST bir xil qoladi).
5. Xohlasangiz public sahifalarni ham `demo-data.ts` o'rniga DB'dan o'qing.

---

## 8. Xavfsizlik holati

- ✅ Admin panel + API'lar auth bilan himoyalangan (`src/middleware.ts`).
- ✅ AI route: IP rate limit (60s/8) + kirish/hajm cheklovi + auth.
- ✅ Upload: faqat rasm MIME, ≤ 8MB, serverda tekshiriladi.
- ✅ Maxfiy kalitlar `NEXT_PUBLIC_` siz (faqat serverda).
- 🔜 Production'da: `ADMIN_PASSWORD` ni kuchli qiling; ko'p admin kerak bo'lsa
  Prisma foydalanuvchi bazasi + parol hash (bcrypt); rate limit uchun Upstash
  Redis (`@upstash/redis` o'rnatilgan).

---

## Qisqacha: hoziroq nima qilishim kerak?

1. `.env.local` da `ADMIN_PASSWORD` ni o'zgartiring va `ANTHROPIC_API_KEY` qo'ying.
2. `npm run dev` → `/admin` ga login bilan kiring → kino qo'shib ko'ring
   (rasm yuklash + AI to'ldirish + Saqlash ishlaydi).
3. `NEXT_PUBLIC_SITE_URL` ga real domen → Vercel'ga deploy (barcha kalitlar bilan).
4. Search Console + Yandex Webmaster'da tasdiqlab `sitemap.xml` yuboring.
5. Production storage (6) va DB (7) ni real xizmatlarga ulang.
