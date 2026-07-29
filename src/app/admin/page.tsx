import type { Metadata } from "next";
import { Film, Tv, Users, Eye, TrendingUp, Star, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getAllMovies } from "@/lib/movies";
import { formatViewCount } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const allMovies = await getAllMovies();
  const movies = allMovies.filter((movie) => movie.type !== "SERIAL");
  const serials = allMovies.filter((movie) => movie.type === "SERIAL");
  const totalViews = allMovies.reduce((sum, movie) => sum + (movie.viewCount ?? 0), 0);
  const rated = allMovies.filter((movie) => movie.imdbRating !== undefined);
  const avgRating = rated.length ? (rated.reduce((sum, movie) => sum + (movie.imdbRating ?? 0), 0) / rated.length).toFixed(1) : "—";
  const topMovie = [...allMovies].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))[0];
  const recent = allMovies.slice(0, 6);
  const stats = [
    { label: "Jami kinolar", value: movies.length, icon: Film, color: "#7C3AED", change: "Haqiqiy baza" },
    { label: "Jami seriallar", value: serials.length, icon: Tv, color: "#EC4899", change: "Haqiqiy baza" },
    { label: "Jami ko'rishlar", value: formatViewCount(totalViews), icon: Eye, color: "#06B6D4", change: "Haqiqiy baza" },
    { label: "O'rtacha reyting", value: avgRating, icon: Star, color: "#F59E0B", change: "IMDb bo'yicha" },
    { label: "Foydalanuvchilar", value: "—", icon: Users, color: "#10B981", change: "Telegram login kutilmoqda" },
    { label: "Bugungi sessiyalar", value: "—", icon: TrendingUp, color: "#8B5CF6", change: "Analitika ulanmagan" },
  ];
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            UZDUB Play platformasi umumiy ko&apos;rinishi
          </p>
        </div>
        <Link
          href="/admin/kinolar/yangi"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
        >
          <Film className="h-4 w-4" />
          Yangi kino qo&apos;shish
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: `${stat.color}20` }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
              {stat.value}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent content */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
              So&apos;nggi qo&apos;shilgan
            </h2>
            <Link href="/admin/kinolar" className="text-xs flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--accent-violet)" }}>
              Barchasi <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recent.length ? recent.map((movie) => (
              <div key={movie.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-all" style={{ border: "1px solid var(--border)" }}>
                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-tertiary)" }}>
                  {movie.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm line-clamp-1">{movie.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {movie.type === "SERIAL" ? "Serial" : "Kino"} • {movie.year} • {movie.country}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {movie.imdbRating && (
                      <span className="text-xs font-medium text-yellow-400">★ {movie.imdbRating}</span>
                    )}
                    {movie.viewCount !== undefined && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatViewCount(movie.viewCount)} ko&apos;rishlar</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-medium"
                    style={{
                      background: movie.status === "PUBLISHED" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: movie.status === "PUBLISHED" ? "#10B981" : "#EF4444",
                    }}
                  >
                    {movie.status === "PUBLISHED" ? "Nashr" : "Qoralama"}
                  </span>
                  <Link
                    href={`/admin/kinolar/${movie.id}`}
                    className="p-1.5 rounded-lg transition-all hover:bg-white/8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )) : <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>Bazaga hali kontent qo'shilmagan.</p>}
          </div>
        </div>

        {/* Top movie + quick actions */}
        <div className="space-y-4">
          {/* Top movie */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              🏆 Eng ko&apos;p ko&apos;rilgan
            </h2>
            {topMovie ? <div className="flex gap-3">
              <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-tertiary)" }}>
                {topMovie.posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topMovie.posterUrl} alt={topMovie.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{topMovie.title}</p>
                <p className="text-xs mt-0.5 mb-2" style={{ color: "var(--text-muted)" }}>{topMovie.year}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-violet)" }} />
                    <span className="text-xs text-white">{formatViewCount(topMovie.viewCount ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-white">{topMovie.imdbRating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{topMovie.duration} daqiqa</span>
                  </div>
                </div>
              </div>
            </div> : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Eng ko'p ko'rilgan kontent hali yo'q.</p>}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Tez harakatlar
            </h2>
            <div className="space-y-2">
              {[
                { label: "Yangi kino qo'shish", href: "/admin/kinolar/yangi", color: "#7C3AED" },
                { label: "Foydalanuvchilarni ko'rish", href: "/admin/foydalanuvchilar", color: "#EC4899" },
                { label: "Statistikani ko'rish", href: "/admin/statistika", color: "#06B6D4" },
                { label: "Sozlamalar", href: "/admin/sozlamalar", color: "#10B981" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5 group"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <span className="text-white group-hover:text-purple-300 transition-colors">{action.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: action.color }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
