"use client";

import { useCallback, useEffect, useState } from "react";

// localStorage asosidagi ro'yxat (sevimli / keyin ko'raman) — akkauntsiz ishlaydi
export function useSavedList(key: "favorites" | "watchLater") {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`uzdub_${key}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage'ni faqat mount'da o'qiymiz (SSR/hydration uchun)
      setIds(raw ? JSON.parse(raw) : []);
    } catch {
      setIds([]);
    }
    // boshqa tabda o'zgarsa yangilash
    const onStorage = (e: StorageEvent) => {
      if (e.key === `uzdub_${key}`) {
        try {
          setIds(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
        try {
          localStorage.setItem(`uzdub_${key}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key]
  );

  return { ids, has, toggle };
}
