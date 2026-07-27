"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/animations";
import MovieCard from "@/components/movie/MovieCard";
import type { Movie } from "@/types/movie";

interface CategoryRowProps {
  title: string;
  href?: string;
  movies: Movie[];
  cardSize?: "sm" | "md" | "lg";
}

export default function CategoryRow({
  title,
  href,
  movies,
  cardSize = "md",
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (!movies.length) return null;

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-4 md:px-8 max-w-[1400px] mx-auto">
        <h2
          className="text-xl md:text-2xl font-bold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {/* Scroll buttons */}
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg transition-all hover:bg-white/8 hidden md:flex"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg transition-all hover:bg-white/8 hidden md:flex"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {href && (
            <Link
              href={href}
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-white"
              style={{ color: "var(--accent-violet)" }}
            >
              Barchasi
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-8"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex gap-3 md:gap-4"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="shrink-0"
              style={{
                width:
                  cardSize === "lg"
                    ? "200px"
                    : cardSize === "sm"
                    ? "130px"
                    : "160px",
                scrollSnapAlign: "start",
              }}
            >
              <MovieCard movie={movie} size={cardSize} />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
