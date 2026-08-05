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
        // Allaqachon qo'shilgan
        done();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = false; // parallel yuklab, DOM tartibida bajaradi
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

type Props = { src?: string; poster?: string | null; movieId?: string; episodeId?: string; onEnded?: () => void };

export default function UzdubPlayer({ src, poster, movieId, episodeId, onEnded }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  const embedSavedRef = useRef(false);
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!src || !ref.current) return;
    let player: PlayerInstance | null = null;
    let cancelled = false;
    let video: HTMLVideoElement | null = null;
    // Birinchi progress 5-soniyada saqlanadi, keyingilari 15 soniya oralig'ida.
    // Shu sabab foydalanuvchi qisqa tomosha qilib sahifadan chiqsa ham "Davom ettirish" paydo bo'ladi.
    let lastSaved = -10;
    const progressUrl = movieId ? `/api/profile/progress?movieId=${encodeURIComponent(movieId)}${episodeId ? `&episodeId=${encodeURIComponent(episodeId)}` : ""}` : null;
    const resume = progressUrl ? fetch(progressUrl, { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null) : Promise.resolve(null);
    const save = (completed = false) => {
      if (!video || !movieId || !Number.isFinite(video.currentTime) || !Number.isFinite(video.duration)) return;
      const positionSeconds = Math.max(0, Math.floor(video.currentTime));
      const durationSeconds = Math.max(0, Math.floor(video.duration));
      if (!durationSeconds) return;
      void fetch("/api/profile/progress", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ movieId, episodeId, positionSeconds, durationSeconds, completed }) }).catch(() => {});
    };
    const useVideoEvent = (event: Event): HTMLVideoElement | null => {
      const target = event.target;
      if (!(target instanceof HTMLVideoElement) || target.classList.contains("uzdub-ad-video")) return null;
      video = target;
      return target;
    };
    const onTimeUpdate = (event: Event) => { const target = useVideoEvent(event); if (target && target.currentTime - lastSaved >= 15) { lastSaved = target.currentTime; save(); } };
    const onPause = () => save();
    const onVideoEnded = () => { save(true); onEndedRef.current?.(); };
    const onPageHide = () => save();
    const onMetadata = async () => {
      const data = await resume;
      const position = data?.progress?.positionSeconds;
      if (!cancelled && video && typeof position === "number" && position > 5 && position < video.duration - 10) {
        video.currentTime = position;
        lastSaved = position;
      }
    };

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

    // UI player video elementini ichkarida almashtirishi mumkin. Capture fazasi
    // yangi yaratilgan video eventlarini ham ishonchli ushlaydi.
    const root = ref.current;
    const onMetadataCapture = (event: Event) => { if (useVideoEvent(event)) void onMetadata(); };
    const onPauseCapture = (event: Event) => { if (useVideoEvent(event)) onPause(); };
    const onEndedCapture = (event: Event) => { if (useVideoEvent(event)) onVideoEnded(); };
    root.addEventListener("loadedmetadata", onMetadataCapture, true);
    root.addEventListener("timeupdate", onTimeUpdate, true);
    root.addEventListener("pause", onPauseCapture, true);
    root.addEventListener("ended", onEndedCapture, true);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      if (video) onPause();
      root.removeEventListener("loadedmetadata", onMetadataCapture, true);
      root.removeEventListener("timeupdate", onTimeUpdate, true);
      root.removeEventListener("pause", onPauseCapture, true);
      root.removeEventListener("ended", onEndedCapture, true);
      window.removeEventListener("pagehide", onPageHide);
      try {
        player?.destroy();
      } catch {
        // ignore
      }
    };
  }, [src, poster, movieId, episodeId]);

  const directSource = src && /\.(m3u8|mp4|webm|mov)(?:$|[?#])/i.test(src) ? src : undefined;
  const isEmbedSource = Boolean(src && /(youtube\.com|youtu\.be|ok\.ru|odnoklassniki\.ru|mover\.uz)/i.test(src));
  const saveEmbedStart = () => {
    if (!isEmbedSource || !movieId || embedSavedRef.current) return;
    embedSavedRef.current = true;
    // Iframe ichidagi vaqtni o'qish cross-origin xavfsizlik qoidasi bilan taqiqlangan.
    // Shuning uchun bunday manbalarda foydalanuvchi tomoshani boshlagani saqlanadi.
    void fetch("/api/profile/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ movieId, episodeId, positionSeconds: 1, durationSeconds: 0, completed: false }) }).catch(() => {});
  };
  return (
    <div ref={ref} onPointerDownCapture={saveEmbedStart} style={{ width: "100%", aspectRatio: "16 / 9" }} role="region" aria-label="Video player">
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
