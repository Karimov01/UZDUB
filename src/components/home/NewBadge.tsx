"use client";

import { useEffect, useState } from "react";

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;

function remainingTime(publishedAt?: string): number {
  if (!publishedAt) return 0;
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, timestamp + NEW_WINDOW_MS - Date.now());
}

export default function NewBadge({ publishedAt }: { publishedAt?: string }) {
  // Server va brauzer bir xil HTML bilan boshlashi uchun vaqtga bog'liq
  // hisobni faqat hydration tugagandan keyin bajaramiz.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const remaining = remainingTime(publishedAt);
    setVisible(remaining > 0);
    if (!remaining) return;
    const timer = window.setTimeout(() => setVisible(false), Math.min(remaining, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [publishedAt]);
  return visible ? <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-extrabold leading-none text-white shadow">NEW</span> : null;
}
