"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <div className="absolute right-8 -top-11 hidden gap-2 md:flex">
        <button type="button" onClick={() => scroll("left")} aria-label="Oldingi kartalar" className="p-1.5 rounded-lg transition-colors hover:bg-white/8" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => scroll("right")} aria-label="Keyingi kartalar" className="p-1.5 rounded-lg transition-colors hover:bg-white/8" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
