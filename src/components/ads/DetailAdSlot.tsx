"use client";

import Script from "next/script";

export default function DetailAdSlot() {
  return (
    <>
      <Script id="adfinity-detail" src="https://cdn.adfinity.pro/code/8414/adfinity.js" strategy="afterInteractive" />
      <aside
        aria-label="Reklama"
        className="mb-3 flex min-h-[100px] w-full items-center justify-center overflow-hidden rounded-xl border border-white/[.08] bg-white/[.025] md:mb-4 md:min-h-[250px] md:rounded-2xl"
      >
        <div className="adfinity_block_19509 w-full" />
      </aside>
    </>
  );
}
