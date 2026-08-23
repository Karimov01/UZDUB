"use client";

import { useEffect } from "react";

const GLOBAL_YANDEX_BLOCKS = [
  { blockId: "R-A-19801166-13", type: "fullscreen", platform: "touch" },
  { blockId: "R-A-19801166-14", type: "fullscreen", platform: "desktop" },
  { blockId: "R-A-19801166-15", type: "floorAd", platform: "touch" },
  { blockId: "R-A-19801166-17", type: "floorAd", platform: "desktop" },
] as const;

/**
 * Yandex boshqaradigan fullscreen va floorAd formatlari.
 * Komponent DOM banner yaratmaydi: platforma, joylashuv va frequency'ni Yandex boshqaradi.
 */
export default function YandexGlobalAds() {
  useEffect(() => {
    const initialized = (window.__uzdubYandexAds ??= new Set<string>());
    window.yaContextCb = window.yaContextCb || [];

    for (const ad of GLOBAL_YANDEX_BLOCKS) {
      if (initialized.has(ad.blockId)) continue;
      initialized.add(ad.blockId);

      window.yaContextCb.push(() => {
        const manager = window.Ya?.Context?.AdvManager;
        if (!manager) return;

        manager.render(ad);
      });
    }
  }, []);

  return null;
}
