"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (options: { blockId: string; renderTo: string }) => void;
        };
      };
    };
  }
}

const activeBlocks = new Set<string>();

type YandexAdProps = {
  blockId: string;
  className?: string;
};

/**
 * Yandex RTB blokini xavfsiz, bir martalik render qiladi.
 * Bir xil blockId bitta ochiq sahifada ikki marta ishga tushirilmaydi.
 */
export default function YandexAd({ blockId, className = "" }: YandexAdProps) {
  const containerId = `yandex_rtb_${blockId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAd, setHasAd] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeBlocks.has(blockId)) return;

    let isMounted = true;
    let didRender = false;
    activeBlocks.add(blockId);

    const markAdPresence = () => {
      if (!isMounted) return;
      const hasVisibleContent = container.childElementCount > 0 && container.getBoundingClientRect().height > 0;
      if (hasVisibleContent) setHasAd(true);
    };

    const render = () => {
      if (!isMounted || didRender) return;
      const manager = window.Ya?.Context?.AdvManager;
      if (!manager) return;

      didRender = true;
      manager.render({ blockId, renderTo: containerId });
      window.setTimeout(markAdPresence, 0);
    };

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(render);

    const observer = new MutationObserver(markAdPresence);
    observer.observe(container, { childList: true, subtree: true });
    const timeout = window.setTimeout(markAdPresence, 2500);

    return () => {
      isMounted = false;
      observer.disconnect();
      window.clearTimeout(timeout);
      activeBlocks.delete(blockId);
    };
  }, [blockId, containerId]);

  return (
    <section
      aria-label="Reklama"
      className={`mx-auto w-full max-w-[1400px] overflow-hidden px-4 md:px-8 ${hasAd ? "py-4 md:py-6" : "py-2 md:py-3"} transition-[padding] duration-200 motion-reduce:transition-none ${className}`}
    >
      <div
        ref={containerRef}
        id={containerId}
        className={`mx-auto w-full overflow-hidden text-center [&_iframe]:mx-auto ${hasAd ? "min-h-[50px] md:min-h-[90px]" : "min-h-0"}`}
      />
    </section>
  );
}
