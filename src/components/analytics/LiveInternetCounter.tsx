"use client";

import { useEffect } from "react";

/** LiveInternet tashrif hisoblagichi — foydalanuvchi bergan hisoblagich IDsi. */
export default function LiveInternetCounter() {
  useEffect(() => {
    const image = document.getElementById("licnt6E5C") as HTMLImageElement | null;
    if (!image) return;
    const screenData = window.screen;
    image.src = `https://counter.yadro.ru/hit?t20.8;r${escape(document.referrer)};s${screenData.width}*${screenData.height}*${screenData.colorDepth || screenData.pixelDepth};u${escape(document.URL)};h${escape(document.title.substring(0, 150))};${Math.random()}`;
  }, []);

  return (
    <a href="https://www.liveinternet.ru/click" target="_blank" rel="noopener noreferrer" aria-label="LiveInternet statistikasi">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img id="licnt6E5C" width="88" height="31" fetchPriority="high" decoding="async" className="opacity-70 hover:opacity-100 transition-opacity" style={{ border: 0 }} alt="LiveInternet" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7" />
    </a>
  );
}
