import { SITE_URL } from "@/lib/constants";

/** Yandex IndexNow signalini faqat kontent o‘zgarganda yuboradi; xato saqlash oqimini to‘xtatmaydi. */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !paths.length) return;
  const host = new URL(SITE_URL).host;
  try {
    const response = await fetch("https://yandex.com/indexnow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ host, key, keyLocation: `${SITE_URL}/${key}.txt`, urlList: paths.map((path) => path.startsWith("http") ? path : `${SITE_URL}${path}`) }) });
    if (!response.ok) console.error("[indexnow] Yandex signal yuborilmadi", { status: response.status });
  } catch { console.error("[indexnow] Tarmoq xatosi"); }
}
