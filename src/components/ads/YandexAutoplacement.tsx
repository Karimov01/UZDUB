"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const YANDEX_PAGE_ID = "19801166";

/** Yandex Reklama tarmog'i avtomatik bloklari — faqat public sahifalarda. */
export default function YandexAutoplacement() {
  const pathname = usePathname();

  // Reklama boshqaruv paneli va login oqimiga yuklanmaydi.
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <Script
        id="yandex-context"
        src="https://yandex.ru/ads/system/context.js"
        strategy="afterInteractive"
      />
      <Script
        id="yandex-autoplacement"
        src="https://yandex.ru/ads/system/ap-loader.js"
        data-page-id={YANDEX_PAGE_ID}
        strategy="afterInteractive"
      />
    </>
  );
}
