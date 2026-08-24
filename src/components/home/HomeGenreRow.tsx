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
    <section className="relative mx-auto max-w-[1400px] px-4 py-3 md:px-8" aria-label="Janrlar">
      <h2 className="sr-only">Janrlar</h2>
      <div ref={rowRef} className="flex flex-nowrap gap-2.5 overflow-x-auto pr-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GENRES.map(({ label, slug, icon: Icon }, index) => (
          <Link
            key={slug}
            href={`/janr/${slug}`}
            className={`inline-flex h-[54px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl border px-5 text-sm font-medium text-white transition-colors hover:bg-white/[.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 md:h-[46px] ${index === 0 ? "border-fuchsia-400 bg-fuchsia-500/[.08]" : "border-white/15 bg-white/[.025]"}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
      <button type="button" onClick={scrollRight} aria-label="Janrlarni o‘ngga surish" className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0c0d12]/95 text-white shadow-[-10px_0_18px_rgba(8,9,14,.95)] transition-colors hover:border-fuchsia-400 md:right-8"><ChevronRight className="h-5 w-5" /></button>
    </section>
  );
}
