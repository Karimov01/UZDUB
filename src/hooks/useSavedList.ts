"use client";

import { useCallback, useEffect, useState } from "react";

type Key = "favorites" | "watchLater";
const apiType: Record<Key, "FAVORITE" | "WATCH_LATER"> = { favorites: "FAVORITE", watchLater: "WATCH_LATER" };

/** Login qilingan userda Neon bazasi, mehmon rejimida esa oldingi localStorage ishlaydi. */
export function useSavedList(key: Key) {
  const [ids, setIds] = useState<string[]>([]);
  const [databaseMode, setDatabaseMode] = useState(false);

  useEffect(() => {
    let alive = true;
    const local = () => { try { if (alive) setIds(JSON.parse(localStorage.getItem(`uzdub_${key}`) || "[]")); } catch { if (alive) setIds([]); } };
    fetch(`/api/profile/lists?type=${apiType[key]}`, { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => { if (!alive) return; if (response.ok && Array.isArray(data.ids)) { setDatabaseMode(true); setIds(data.ids); } else local(); })
      .catch(local);
    return () => { alive = false; };
  }, [key]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(async (id: string) => {
    const wasSaved = ids.includes(id); const next = wasSaved ? ids.filter((item) => item !== id) : [id, ...ids];
    setIds(next);
    if (!databaseMode) { try { localStorage.setItem(`uzdub_${key}`, JSON.stringify(next)); } catch { /* ignore */ } return; }
    try {
      const response = await fetch("/api/profile/lists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ movieId: id, type: apiType[key] }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setIds((current) => data.saved ? (current.includes(id) ? current : [id, ...current]) : current.filter((item) => item !== id));
    } catch { setIds(ids); }
  }, [databaseMode, ids, key]);
  return { ids, has, toggle, databaseMode };
}
