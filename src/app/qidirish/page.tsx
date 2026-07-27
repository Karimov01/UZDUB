"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { DEMO_MOVIES } from "@/lib/demo-data";
import MovieCard from "@/components/movie/MovieCard";

export default function QidirishPage() {
  const [query, setQuery] = useState("");

  const results = query.trim().length > 1
    ? DEMO_MOVIES.filter((m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.originalTitle?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-10">
      <h1 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
        Qidiruv
      </h1>

      {/* Search input */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-8"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-hover)" }}
      >
        <Search className="h-5 w-5 shrink-0" style={{ color: "var(--accent-violet)" }} />
        <input
          autoFocus
          type="text"
          placeholder="Kino yoki serial nomini kiriting..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-base"
        />
        {query && (
          <button onClick={() => setQuery("")}>
            <X className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {/* Results */}
      {query.trim().length > 1 && (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            &quot;{query}&quot; uchun {results.length} ta natija
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-medium text-white mb-2">Natija topilmadi</p>
              <p style={{ color: "var(--text-muted)" }}>Boshqa so&apos;z bilan qayta urinib ko&apos;ring</p>
            </div>
          )}
        </>
      )}

      {/* Trending searches */}
      {query.trim().length <= 1 && (
        <div>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--text-muted)" }}>
            Trend qidiruvlar
          </p>
          <div className="flex flex-wrap gap-2">
            {["Interstellar", "Breaking Bad", "Duna", "Inception", "Squid Game", "Oppenheimer"].map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
