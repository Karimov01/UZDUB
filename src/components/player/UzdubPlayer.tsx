"use client";

import { useEffect, useRef } from "react";

interface PlayerSource {
  src: string;
  type?: string | null;
  poster?: string | null;
  vast?: string | null;
  yandex?: unknown;
}
interface PlayerInstance {
  init: () => void;
  load: (source: PlayerSource) => void;
  destroy: () => void;
}
type PlayerCtor = new (el: HTMLElement | string) => PlayerInstance;

// player.core.js `class UZDUBPlayer` — klassik skriptda leksik global (window'da EMAS).
// Shuning uchun uni global doiradan olamiz.
function getPlayerCtor(): PlayerCtor | null {
  try {
    return new Function("return typeof UZDUBPlayer !== 'undefined' ? UZDUBPlayer : null")() as PlayerCtor | null;
  } catch {
    return null;
  }
}

// Skriptlar KETMA-KET yuklanishi shart (bir-biriga bog'liq)
const SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/hls.js@1",
  "/player/player.utils.js",
  "/player/player.ui.js",
  "/player/player.sources.js",
  "/player/player.events.js",
  "/player/player.vast.js",
  "/player/player.yandex.js",
  "/player/player.core.js",
];

let scriptsPromise: Promise<void> | null = null;
function loadScripts(): Promise<void> {
  if (scriptsPromise) return scriptsPromise;
  scriptsPromise = SCRIPTS.reduce(
    (chain, src) =>
      chain.then(
        () =>
          new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement("script");
            s.src = src;
            s.async = false;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Player skript yuklanmadi: ${src}`));
            document.head.appendChild(s);
          })
      ),
    Promise.resolve()
  );
  return scriptsPromise;
}

function ensureStyles() {
  if (!document.querySelector("link[data-uzdub-player-css]")) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "/player/player.css";
    l.setAttribute("data-uzdub-player-css", "");
    document.head.appendChild(l);
  }
  if (!document.querySelector("link[data-uzdub-player-icons]")) {
    const f = document.createElement("link");
    f.rel = "stylesheet";
    f.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0";
    f.setAttribute("data-uzdub-player-icons", "");
    document.head.appendChild(f);
  }
}

export default function UzdubPlayer({ src, poster }: { src?: string; poster?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!src || !ref.current) return;
    let player: PlayerInstance | null = null;
    let cancelled = false;

    ensureStyles();
    loadScripts()
      .then(() => {
        const Ctor = getPlayerCtor();
        if (cancelled || !ref.current || !Ctor) return;
        player = new Ctor(ref.current);
        player.init();
        player.load({ src, poster: poster ?? null });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        // ignore
      }
    };
  }, [src, poster]);

  return <div ref={ref} style={{ width: "100%" }} />;
}
