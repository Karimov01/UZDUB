"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Info, Star, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { Movie } from "@/types/movie";
import { useSavedList } from "@/hooks/useSavedList";

interface HeroBannerProps {
  movies: Movie[];
}

export default function HeroBanner({ movies }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState("");
  const router = useRouter();
  const later = useSavedList("watchLater");

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies.length) return null;

  const movie = movies[current];
  const href =
    movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`;
  const saved = later.has(movie.id);
  const toggleLater = () => {
    if (!later.isAuthenticated) return router.push("/kirish");
    later.toggle(movie.id);
    setToast(saved ? "Keyin ko‘raman ro‘yxatidan olib tashlandi" : "Keyin ko‘raman ro‘yxatiga qo‘shildi");
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <div className="relative w-full h-[88vh] min-h-[500px] overflow-hidden">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {movie.backdropUrl && !imgError[current] ? (
            <Image
              src={movie.backdropUrl}
              alt={movie.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
              onError={() => setImgError((p) => ({ ...p, [current]: true }))}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #0A0A0F, #1a0a2e)" }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 50%, rgba(10,10,15,0.2) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.3) 40%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative h-full max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col justify-end pb-16 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {movie.isTrending && <Badge variant="pink">🔥 Trend</Badge>}
              {movie.isFeatured && <Badge variant="purple">⭐ Tanlangan</Badge>}
              {movie.genres?.[0] && (
                <Badge variant="default">{movie.genres[0].name}</Badge>
              )}
              {movie.year && (
                <Badge variant="default">{movie.year}</Badge>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-bold text-white mb-3 leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
              }}
            >
              {movie.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {movie.imdbRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">
                    {movie.imdbRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">IMDb</span>
                </div>
              )}
              {movie.duration && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatDuration(movie.duration)}</span>
                </div>
              )}
              {movie.country && (
                <span className="text-sm text-gray-400">{movie.country}</span>
              )}
              {movie.dubbing && (
                <Badge variant="green" size="sm">{movie.dubbing} dublyaj</Badge>
              )}
            </div>

            {/* Description */}
            {movie.shortDesc && (
              <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3 max-w-lg">
                {movie.shortDesc}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`${href}/tomosha`}>
                <Button size="lg">
                  <Play className="h-5 w-5 fill-white" />
                  Tomosha qilish
                </Button>
              </Link>
              <Link href={href}>
                <Button variant="secondary" size="lg">
                  <Info className="h-5 w-5" />
                  Batafsil
                </Button>
              </Link>
              <button
                onClick={toggleLater}
                aria-label={saved ? "Keyin ko‘raman ro‘yxatidan olib tashlash" : "Keyin ko‘ramanga qo‘shish"}
                className="p-3 rounded-xl transition-all hover:bg-white/12"
                style={{
                  background: saved ? "rgba(124,58,237,.28)" : "rgba(255,255,255,0.08)",
                  border: saved ? "1px solid rgba(168,85,247,.7)" : "1px solid var(--border)",
                }}
              >
                {saved ? <span className="text-lg leading-none text-white">✓</span> : <Plus className="h-5 w-5 text-white" />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        {movies.length > 1 && (
          <div className="flex items-center gap-2 mt-8">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  height: "4px",
                  width: i === current ? "28px" : "16px",
                  background:
                    i === current
                      ? "linear-gradient(90deg, #7C3AED, #EC4899)"
                      : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {movies.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p - 1 + movies.length) % movies.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass transition-all hover:scale-110 hidden md:flex"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % movies.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass transition-all hover:scale-110 hidden md:flex"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}
      {toast && <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl text-sm text-white" style={{ background: "rgba(28,20,47,.96)", border: "1px solid rgba(168,85,247,.6)", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>{toast}</div>}
    </div>
  );
}
