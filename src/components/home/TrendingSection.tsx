"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Eye } from "lucide-react";
import { fadeInUp, staggerChildren } from "@/lib/animations";
import { formatViewCount } from "@/lib/utils";
import type { Movie } from "@/types/movie";

interface TrendingSectionProps {
  movies: Movie[];
}

export default function TrendingSection({ movies }: TrendingSectionProps) {
  if (!movies.length) return null;

  return (
    <section className="py-6 px-4 md:px-8 max-w-[1400px] mx-auto">
      <motion.h2
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-xl md:text-2xl font-bold text-white mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        🔥 Bugungi Trendlar
      </motion.h2>

      <motion.div
        variants={staggerChildren}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {movies.slice(0, 10).map((movie, index) => {
          const href =
            movie.type === "SERIAL"
              ? `/serial/${movie.slug}`
              : `/kino/${movie.slug}`;

          return (
            <motion.div key={movie.id} variants={fadeInUp}>
              <Link href={href} className="group flex items-center gap-3">
                {/* Big number */}
                <span
                  className="text-6xl font-black shrink-0 leading-none select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "rgba(255,255,255,0.08)",
                    WebkitTextStroke: "1px rgba(255,255,255,0.15)",
                    minWidth: "52px",
                  }}
                >
                  {index + 1}
                </span>

                {/* Poster */}
                <div
                  className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  {movie.posterUrl && (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="64px"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {movie.imdbRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-medium">
                          {movie.imdbRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {movie.viewCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatViewCount(movie.viewCount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
