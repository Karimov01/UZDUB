"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Heart, Clock, Star, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDuration, formatViewCount } from "@/lib/utils";
import { scaleIn } from "@/lib/animations";
import type { Movie } from "@/types/movie";
import Badge from "@/components/ui/Badge";

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export default function MovieCard({
  movie,
  size = "md",
  showProgress = false,
  progress = 0,
  className,
}: MovieCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const href =
    movie.type === "SERIAL"
      ? `/serial/${movie.slug}`
      : `/kino/${movie.slug}`;

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn("group relative shrink-0", className)}
    >
      <Link href={href} className="block">
        {/* Poster */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl",
            size === "sm" && "aspect-[2/3]",
            size === "md" && "aspect-[2/3]",
            size === "lg" && "aspect-[2/3]"
          )}
          style={{ background: "var(--bg-tertiary)" }}
        >
          {movie.posterUrl && !imgError ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                hovered && "scale-105"
              )}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-10 w-10 text-gray-600" />
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 flex items-center justify-center",
              hovered ? "opacity-100" : "opacity-0"
            )}
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
            >
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {movie.isTrending && (
              <Badge variant="pink" size="sm">Trend</Badge>
            )}
            {movie.isPremium && (
              <Badge variant="yellow" size="sm">Premium</Badge>
            )}
          </div>

          {/* Wishlist button */}
          <button
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200",
              hovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
            )}
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
            }}
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <Heart className="h-4 w-4 text-white" />
          </button>

          {/* IMDB rating */}
          {movie.imdbRating && (
            <div
              className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: "#F5C518", color: "#000" }}
            >
              <Star className="h-3 w-3 fill-black" />
              {movie.imdbRating.toFixed(1)}
            </div>
          )}

          {/* Progress bar */}
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: "linear-gradient(90deg, #7C3AED, #EC4899)",
                }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2.5 px-0.5">
          <h3
            className={cn(
              "font-semibold line-clamp-1 text-white group-hover:text-purple-300 transition-colors",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {movie.year && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {movie.year}
              </span>
            )}
            {movie.duration && (
              <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
                <Clock className="h-3 w-3" />
                {formatDuration(movie.duration)}
              </span>
            )}
            {movie.viewCount !== undefined && (
              <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
                <Eye className="h-3 w-3" />
                {formatViewCount(movie.viewCount)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
