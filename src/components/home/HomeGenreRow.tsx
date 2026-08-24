"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, Fingerprint, Ghost, Map, MessageSquare, Moon, Shield, Smile, Sparkles, Swords } from "lucide-react";

const GENRES = [
  { label: "Jangari", slug: "harakatli", icon: Swords },
  { label: "Komediya", slug: "komediya", icon: Smile },
  { label: "Drama", slug: "drama", icon: MessageSquare },
  { label: "Fantastika", slug: "fantastik", icon: Sparkles },
  { label: "Ujas", slug: "dahshat", icon: Moon },
  { label: "Triller", slug: "triller", icon: Ghost },
  { label: "Harbiy", slug: "harbiy", icon: Shield },
  { label: "Multfilmlar", slug: "multfilm", icon: Sparkles },
  { label: "Sarguzasht", slug: "sarguzasht", icon: Map },
  { label: "Kriminal", slug: "jinoyat", icon: Fingerprint },
];

export default function HomeGenreRow() {
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollRight = () => rowRef.current?.scrollBy({ left: Math.max(280, rowRef.current.clientWidth * 0.7), behavior: "smooth" });

  return (
    <section className="relative mx-auto max-w-[1400px] px-2 py-2 min-[360px]:px-3 sm:px-4 md:px-8 md:py-3" aria-label="Janrlar">
      <h2 className="sr-only">Janrlar</h2>
      <div ref={rowRef} className="flex flex-nowrap gap-2 overflow-x-auto pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2.5 md:pr-12">
        {GENRES.map(({ label, slug, icon: Icon }, index) => (
          <Link
            key={slug}
            href={`/janr/${slug}`}
            className={`inline-flex h-[46px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-[13px] font-medium text-white transition-colors hover:bg-white/[.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 min-[360px]:px-3.5 md:h-[46px] md:gap-2.5 md:px-5 md:text-sm ${index === 0 ? "border-fuchsia-400 bg-fuchsia-500/[.08]" : "border-white/15 bg-white/[.025]"}`}
          >
            <Icon className="h-[17px] w-[17px] shrink-0 min-[360px]:h-[18px] min-[360px]:w-[18px] md:h-5 md:w-5" />
            {label}
          </Link>
        ))}
      </div>
      <button type="button" onClick={scrollRight} aria-label="Janrlarni o'ngga surish" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0c0d12]/95 text-white shadow-[-10px_0_18px_rgba(8,9,14,.95)] transition-colors hover:border-fuchsia-400 min-[360px]:right-3 md:right-8 md:h-10 md:w-10"><ChevronRight className="h-[18px] w-[18px] md:h-5 md:w-5" /></button>
    </section>
  );
}
