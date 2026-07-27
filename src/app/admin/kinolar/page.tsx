"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Edit, Trash2, Eye, Star, Filter } from "lucide-react";
import { DEMO_MOVIES } from "@/lib/demo-data";
import { formatViewCount } from "@/lib/utils";
import type { Movie } from "@/types/movie";

const TYPE_LABELS: Record<string, string> = {
  MOVIE: "Kino", SERIAL: "Serial", CARTOON: "Multfilm", DOCUMENTARY: "Hujjatli", SHOW: "Show",
};

export default function AdminKinolarPage() {
  return <Suspense fallback={<div className="p-8 text-white">Yuklanmoqda...</div>}><KinolarTable /></Suspense>;
}

function KinolarTable() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  // Filtrni URL (?type=) dan olamiz; foydalanuvchi tugma bossa, qo'lda tanlov ustun bo'ladi.
  const urlType = searchParams.get("type") ?? "ALL";
  const [manualType, setManualType] = useState<string | null>(null);
  const typeFilter = manualType ?? urlType;
  const setTypeFilter = setManualType;

  // Bazadagi (saqlangan) kinolarni olib, demo ustiga qo'shamiz
  const [dbMovies, setDbMovies] = useState<Movie[]>([]);
  useEffect(() => {
    fetch("/api/movies")
      .then((r) => (r.ok ? r.json() : { movies: [] }))
      .then((d) => setDbMovies(Array.isArray(d.movies) ? d.movies : []))
      .catch(() => {});
  }, []);
  const allMovies = [...dbMovies, ...DEMO_MOVIES];

  const filtered = allMovies.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.originalTitle?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchType = typeFilter === "ALL" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Kontent boshqaruvi
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {allMovies.length} ta kontent mavjud
          </p>
        </div>
        <Link
          href="/admin/kinolar/yangi"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
        >
          <Plus className="h-4 w-4" />
          Yangi kino
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white placeholder-gray-500 text-sm flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          {["ALL", "MOVIE", "SERIAL", "CARTOON"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: typeFilter === t ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--bg-secondary)",
                color: typeFilter === t ? "#fff" : "var(--text-muted)",
                border: typeFilter === t ? "none" : "1px solid var(--border)",
              }}
            >
              {t === "ALL" ? "Barchasi" : TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                {["#", "Kino", "Tur", "Yil", "Reyting", "Ko'rishlar", "Holat", "Amallar"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((movie, index) => (
                <tr
                  key={movie.id}
                  className="group transition-colors hover:bg-white/3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-tertiary)" }}>
                        {movie.posterUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm line-clamp-1">{movie.title}</p>
                        {movie.originalTitle && (
                          <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>{movie.originalTitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{
                        background: movie.type === "SERIAL" ? "rgba(236,72,153,0.15)" : "rgba(124,58,237,0.15)",
                        color: movie.type === "SERIAL" ? "#EC4899" : "#8B5CF6",
                      }}
                    >
                      {TYPE_LABELS[movie.type] ?? movie.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{movie.year}</td>
                  <td className="px-4 py-3">
                    {movie.imdbRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">{movie.imdbRating}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    {formatViewCount(movie.viewCount ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{
                        background: movie.status === "PUBLISHED" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: movie.status === "PUBLISHED" ? "#10B981" : "#EF4444",
                      }}
                    >
                      {movie.status === "PUBLISHED" ? "Nashr" : "Qoralama"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg transition-all hover:bg-white/8"
                        style={{ color: "var(--text-muted)" }}
                        title="Ko'rish"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/admin/kinolar/${movie.id}`}
                        className="p-1.5 rounded-lg transition-all hover:bg-white/8"
                        style={{ color: "var(--accent-violet)" }}
                        title="Tahrirlash"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                        style={{ color: "#EF4444" }}
                        title="O'chirish"
                        onClick={() => alert(`"${movie.title}" o'chirilmoqda (demo rejim)`)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Hech narsa topilmadi</p>
          </div>
        )}
      </div>

      <p className="text-xs mt-3 text-center" style={{ color: "var(--text-muted)" }}>
        {filtered.length} ta natija ko&apos;rsatilmoqda
      </p>
    </div>
  );
}
