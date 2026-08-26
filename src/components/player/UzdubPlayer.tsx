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

// Skriptlar bir-biriga bog'liq. Hammasini birdan qo'shamiz (async=false —
// parallel yuklab, tartib bilan bajaradi -> tez ochiladi). HLS lokal (CDN emas).
const SCRIPTS = [
  "/player/hls.min.js",
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
  scriptsPromise = new Promise<void>((resolve, reject) => {
    let remaining = SCRIPTS.length;
    let failed = false;
    const done = () => {
      if (!failed && --remaining === 0) resolve();
    };
    SCRIPTS.forEach((src) => {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        done();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = done;
      s.onerror = () => {
        failed = true;
        reject(new Error(`Player skript yuklanmadi: ${src}`));
      };
      document.head.appendChild(s);
    });
  });
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

type Props = { src?: string; poster?: string | null; onEnded?: () => void };

export default function UzdubPlayer({ src, poster, onEnded }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    if (!src || !ref.current) return;
    let player: PlayerInstance | null = null;
    let cancelled = false;
    let video: HTMLVideoElement | null = null;
    const getVideoFromEvent = (event: Event): HTMLVideoElement | null => {
      const target = event.target;
      if (!(target instanceof HTMLVideoElement) || target.classList.contains("uzdub-ad-video")) return null;
      video = target;
      return target;
    };
    const onVideoEnded = (event: Event) => { if (getVideoFromEvent(event)) onEndedRef.current?.(); };

    ensureStyles();
    loadScripts()
      .then(() => {
        const Ctor = getPlayerCtor();
        if (cancelled || !ref.current || !Ctor) return;
        player = new Ctor(ref.current);
        player.init();
        player.load({ src, poster: poster ?? null });
        video = ref.current.querySelector("video");
        if (!video) return;
      })
      .catch(() => {});

    const root = ref.current;
    root.addEventListener("ended", onVideoEnded, true);

    return () => {
      cancelled = true;
      root.removeEventListener("ended", onVideoEnded, true);
      try {
        player?.destroy();
      } catch {
        // ignore
      }
    };
  }, [src, poster]);

  const directSource = src && /\.(m3u8|mp4|webm|mov)(?:$|[?#])/i.test(src) ? src : undefined;
  return (
    <div ref={ref} style={{ width: "100%", aspectRatio: "16 / 9" }} role="region" aria-label="Video player">
      <video
        className="uzdub-seo-video"
        controls
        playsInline
        preload="metadata"
        poster={poster ?? undefined}
        src={directSource}
        style={{ width: "100%", height: "100%", display: "block", background: "#000" }}
        aria-label="Videoni tomosha qilish"
      />
    </div>
  );
}
