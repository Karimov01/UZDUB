import type { Metadata } from "next";
import { TrendingUp, Eye, Users, Film, Star, Clock } from "lucide-react";
import { DEMO_MOVIES } from "@/lib/demo-data";
import { formatViewCount } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistika" };

const topByViews = [...DEMO_MOVIES].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 10);
const topByRating = [...DEMO_MOVIES].filter((m) => m.imdbRating).sort((a, b) => (b.imdbRating ?? 0) - (a.imdbRating ?? 0)).slice(0, 10);

const genreStats = (() => {
  const map: Record<string, number> = {};
  DEMO_MOVIES.forEach((m) => m.genres?.forEach((g) => { map[g.name] = (map[g.name] ?? 0) + 1; }));
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
})();

const maxGenreCount = Math.max(...genreStats.map(([, c]) => c));

export default function StatistikaPage() {
  const totalViews = DEMO_MOVIES.reduce((s, m) => s + (m.viewCount ?? 0), 0);
  const movies = DEMO_MOVIES.filter((m) => m.type === "MOVIE");
  const serials = DEMO_MOVIES.filter((m) => m.type === "SERIAL");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Statistika</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Platforma faoliyati tahlili</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Jami kontentlar", value: DEMO_MOVIES.length, icon: Film, color: "#7C3AED" },
          { label: "Jami ko'rishlar", value: formatViewCount(totalViews), icon: Eye, color: "#06B6D4" },
          { label: "Kinolar / Seriallar", value: `${movies.length} / ${serials.length}`, icon: TrendingUp, color: "#EC4899" },
          { label: "O'rt. tomosha vaqti", value: "38 daq", icon: Clock, color: "#10B981" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg" style={{ background: `${s.color}20` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top by views */}
        <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <Eye className="h-4 w-4" style={{ color: "var(--accent-violet)" }} /> Top ko&apos;rishlar
          </h2>
          <div className="space-y-2">
            {topByViews.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs font-bold w-5 shrink-0" style={{ color: i < 3 ? "var(--accent-violet)" : "var(--text-muted)" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white line-clamp-1">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((m.viewCount ?? 0) / (topByViews[0].viewCount ?? 1)) * 100}%`,
                          background: "linear-gradient(90deg, #7C3AED, #EC4899)",
                        }}
                      />
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{formatViewCount(m.viewCount ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top by rating */}
        <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Top reyting
          </h2>
          <div className="space-y-2">
            {topByRating.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs font-bold w-5 shrink-0" style={{ color: i < 3 ? "#F59E0B" : "var(--text-muted)" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white line-clamp-1">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${((m.imdbRating ?? 0) / 10) * 100}%`,
                          background: "linear-gradient(90deg, #F59E0B, #F97316)",
                        }}
                      />
                    </div>
                    <span className="text-xs shrink-0 text-yellow-400 font-medium">★ {m.imdbRating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Genre distribution */}
      <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold text-white mb-5" style={{ fontFamily: "var(--font-display)" }}>
          Janr bo&apos;yicha taqsimot
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {genreStats.map(([genre, count]) => (
            <div key={genre} className="p-3 rounded-xl text-center" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
              <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(count / maxGenreCount) * 100}%`, background: "linear-gradient(90deg, #7C3AED, #EC4899)" }}
                />
              </div>
              <p className="text-sm font-bold text-white">{count}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{genre}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fake visitors chart */}
      <div className="p-5 rounded-2xl mt-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
            <Users className="inline h-4 w-4 mr-2" style={{ color: "var(--accent-violet)" }} />
            Kunlik tashrif buyuruvchilar (oxirgi 7 kun)
          </h2>
          <span className="text-sm font-semibold" style={{ color: "#10B981" }}>+18% ↑</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {[820, 1240, 980, 1560, 1320, 1780, 1247].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{v.toLocaleString()}</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${(v / 1780) * 100}%`,
                  background: i === 6
                    ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                    : "var(--bg-tertiary)",
                }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {["Ds", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
