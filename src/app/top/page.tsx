import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, Eye, Trophy } from "lucide-react";
import { getPublishedMovies } from "@/lib/movies";
import { formatViewCount } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = { title: "Top Kinolar" };

export default async function TopPage() {
  const movies = await getPublishedMovies();
  const sorted = [...movies].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-7 w-7" style={{ color: "var(--accent-violet)" }} />
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Top Kinolar
        </h1>
      </div>

      <div className="space-y-4">
        {sorted.map((movie, index) => {
          const href = movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`;
          return (
            <Link key={movie.id} href={href}>
              <div
                className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-white/5 group"
                style={{ border: "1px solid var(--border)" }}
              >
                {/* Rank */}
                <span
                  className="text-5xl font-black w-16 text-center shrink-0 leading-none select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: index < 3 ? "var(--accent-violet)" : "rgba(255,255,255,0.1)",
                    WebkitTextStroke: index >= 3 ? "1px rgba(255,255,255,0.2)" : "none",
                  }}
                >
                  {index + 1}
                </span>

                {/* Poster */}
                <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-tertiary)" }}>
                  {movie.posterUrl && (
                    <Image src={movie.posterUrl} alt={movie.title} width={64} height={96} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {movie.year} • {movie.country}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {movie.imdbRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">{movie.imdbRating.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.viewCount !== undefined && (
                      <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        <Eye className="h-3.5 w-3.5" />
                        {formatViewCount(movie.viewCount)}
                      </div>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {movie.genres?.slice(0, 2).map((g) => (
                        <span key={g.id} className="text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(124,58,237,0.15)", color: "var(--accent-violet)" }}>
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
