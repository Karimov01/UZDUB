import type { Metadata } from "next";
import { DEMO_MOVIES } from "@/lib/demo-data";
import { Tag, Edit, Trash2 } from "lucide-react";
import AddGenreButton from "@/components/admin/AddGenreButton";

export const metadata: Metadata = { title: "Janrlar" };

const allGenres = (() => {
  const map: Record<string, { name: string; slug: string; count: number }> = {};
  DEMO_MOVIES.forEach((m) => {
    m.genres?.forEach((g) => {
      if (!map[g.id]) map[g.id] = { name: g.name, slug: g.slug, count: 0 };
      map[g.id].count++;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
})();

const COLORS = ["#7C3AED", "#EC4899", "#06B6D4", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F97316", "#14B8A6", "#6366F1", "#DC2626", "#84CC16"];

export default function JanrlarAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Janrlar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{allGenres.length} ta janr mavjud</p>
        </div>
        <AddGenreButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {allGenres.map((genre, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div
              key={genre.slug}
              className="p-4 rounded-2xl group"
              style={{ background: `${color}12`, border: `1px solid ${color}33` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${color}25` }}>
                  <Tag className="h-4 w-4" style={{ color }} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 rounded-lg hover:bg-white/10" style={{ color: "var(--accent-violet)" }}>
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-red-500/10" style={{ color: "#EF4444" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1">{genre.name}</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{genre.count} ta kontent</p>
              <p className="text-xs mt-1" style={{ color }}>/{genre.slug}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
