"use client";

import Link from "next/link";
import { ChevronLeft, VideoOff } from "lucide-react";
import type { Movie } from "@/types/movie";
import UzdubPlayer from "@/components/player/UzdubPlayer";

export default function TomashaClient({ movie }: { movie: Movie }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0a0a0f", borderBottom: "1px solid var(--border)" }}>
        <Link href={`/kino/${movie.slug}`} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">{movie.title}</span>
        </Link>
      </div>

      {/* Player yoki "video yo'q" */}
      <div className="w-full max-w-[1100px] mx-auto">
        {movie.videoUrl ? (
          <UzdubPlayer src={movie.videoUrl} poster={movie.backdropUrl || movie.posterUrl} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-3 text-center" style={{ aspectRatio: "16 / 9", background: "#0d0d12" }}>
            <VideoOff className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
            <p className="text-white font-medium">Video havolasi qo&apos;shilmagan</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Admin panelda ushbu kinoga video havolasini qo&apos;shing</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 py-6" style={{ color: "var(--text-primary)" }}>
        <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>{movie.title}</h1>
        {movie.year && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{movie.year} • {movie.country} • {movie.dubbing} tilida</p>}
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{movie.description}</p>
      </div>
    </div>
  );
}
