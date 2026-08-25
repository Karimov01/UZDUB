"use client";

import { useRef } from "react";
import CarouselArrowButton from "@/components/home/CarouselArrowButton";

export default function HorizontalScroller({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({
      left: (direction === "right" ? 1 : -1) * container.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative mx-auto max-w-[1400px] px-3 sm:px-4 md:px-8">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar md:gap-4" style={{ scrollSnapType: "x mandatory" }}>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-x-3 top-1/2 hidden -translate-y-1/2 items-center justify-between sm:inset-x-4 md:inset-x-8 md:flex"><div className="pointer-events-auto -translate-x-1/2"><CarouselArrowButton direction="left" onClick={() => scroll("left")} /></div><div className="pointer-events-auto translate-x-1/2"><CarouselArrowButton direction="right" onClick={() => scroll("right")} /></div></div>
    </div>
  );
}
