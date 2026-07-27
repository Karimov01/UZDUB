"use client";

import Link from "next/link";
import { ChevronLeft, Play, SkipForward, Volume2, Maximize, Settings } from "lucide-react";
import type { Movie } from "@/types/movie";

export default function TomashaClient({ movie }: { movie: Movie }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
        {movie.backdropUrl && (
          <img src={movie.backdropUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </div>
        </div>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-3" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
          <Link href={`/kino/${movie.slug}`} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{movie.title}</span>
          </Link>
        </div>
        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
          <div className="w-full h-1 rounded-full mb-3 cursor-pointer" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="h-full rounded-full" style={{ width: "35%", background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-gray-300"><Play className="h-6 w-6 fill-white" /></button>
              <button className="text-white hover:text-gray-300"><SkipForward className="h-5 w-5" /></button>
              <button className="text-white hover:text-gray-300"><Volume2 className="h-5 w-5" /></button>
              <span className="text-sm text-gray-300">35:20 / 1:49:00</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-gray-300"><Settings className="h-5 w-5" /></button>
              <button className="text-white hover:text-gray-300"><Maximize className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto w-full px-4 py-6" style={{ color: "var(--text-primary)" }}>
        <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>{movie.title}</h1>
        {movie.year && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{movie.year} • {movie.country} • {movie.dubbing} tilida</p>}
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{movie.description}</p>
      </div>
    </div>
  );
}
