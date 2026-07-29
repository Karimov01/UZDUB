"use client";

import { useState } from "react";
import { Plus, Trash2, Sparkles, Loader2, Film, ArrowDown, ArrowUp, Eye } from "lucide-react";

export interface EpisodeForm {
  id?: string;
  season: string;
  episode: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
}

export function emptyEpisode(nextNum: number): EpisodeForm {
  return { season: "1", episode: String(nextNum), title: "", description: "", videoUrl: "", duration: "" };
}

export default function EpisodeManager({
  episodes,
  onChange,
  serialTitle,
  originalTitle,
}: {
  episodes: EpisodeForm[];
  onChange: (eps: EpisodeForm[]) => void;
  serialTitle: string;
  originalTitle: string;
}) {
  const [aiIndex, setAiIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const update = (i: number, key: keyof EpisodeForm, value: string) => {
    const next = episodes.map((e, idx) => (idx === i ? { ...e, [key]: value } : e));
    onChange(next);
  };

  const add = () => {
    const nextNum = episodes.length ? Math.max(...episodes.map((e) => Number(e.episode) || 0)) + 1 : 1;
    onChange([...episodes, emptyEpisode(nextNum)]);
  };

  const remove = (i: number) => onChange(episodes.filter((_, idx) => idx !== i));
  const move = (i: number, direction: -1 | 1) => {
    const target = i + direction;
    if (target < 0 || target >= episodes.length) return;
    const next = [...episodes];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next.map((episode, index) => ({ ...episode, episode: String(index + 1) })));
  };

  const aiFill = async (i: number) => {
    setAiIndex(i);
    setError("");
    try {
      const ep = episodes[i];
      const res = await fetch("/api/ai-fill-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialTitle, originalTitle, season: ep.season, episode: ep.episode, title: ep.title }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI xatosi");
      const next = episodes.map((e, idx) =>
        idx === i ? { ...e, title: json.data.title || e.title, description: json.data.description || e.description } : e
      );
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI xatosi");
    } finally {
      setAiIndex(null);
    }
  };

  const inputClass = "w-full px-2.5 py-2 rounded-lg text-sm text-white outline-none";
  const inputStyle = { background: "var(--bg-primary)", border: "1px solid var(--border)" };

  return (
    <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-semibold text-white text-sm">
          <Film className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
          Qismlar ({episodes.length})
        </h3>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Qism qo&apos;shish
        </button>
      </div>

      {error && (
        <div className="mb-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>{error}</div>
      )}

      {episodes.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
          Hali qism yo&apos;q. &quot;Qism qo&apos;shish&quot; bilan boshlang.
        </p>
      )}

      <div className="space-y-3">
        {episodes.map((ep, i) => (
          <div key={ep.id ?? i} className="p-3 rounded-xl" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex flex-col gap-1 mt-4">
                <button type="button" aria-label="Yuqoriga" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded disabled:opacity-30" style={{ color: "var(--accent-violet)" }}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Pastga" onClick={() => move(i, 1)} disabled={i === episodes.length - 1} className="p-1 rounded disabled:opacity-30" style={{ color: "var(--accent-violet)" }}><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>
              <div className="w-14">
                <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Mavsum</label>
                <input className={inputClass} style={inputStyle} type="number" value={ep.season} onChange={(e) => update(i, "season", e.target.value)} />
              </div>
              <div className="w-14">
                <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Qism</label>
                <input className={inputClass} style={inputStyle} type="number" value={ep.episode} onChange={(e) => update(i, "episode", e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Qism nomi</label>
                <input className={inputClass} style={inputStyle} placeholder="Qism nomi" value={ep.title} onChange={(e) => update(i, "title", e.target.value)} />
              </div>
              <button
                type="button"
                onClick={() => aiFill(i)}
                disabled={aiIndex === i}
                title="AI bilan nom + tavsif to'ldirish"
                className="mt-4 p-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60 shrink-0"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
              >
                {aiIndex === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => remove(i)} title="O'chirish" className="mt-4 p-2 rounded-lg transition-all hover:bg-red-500/10 shrink-0" style={{ color: "#EF4444" }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Video havolasi (.m3u8 / .mp4)</label>
                <input className={inputClass} style={inputStyle} placeholder="https://..." value={ep.videoUrl} onChange={(e) => update(i, "videoUrl", e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Davomiyligi (daq)</label>
                <input className={inputClass} style={inputStyle} type="number" placeholder="45" value={ep.duration} onChange={(e) => update(i, "duration", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>Tavsif</label>
              <textarea className={inputClass} style={{ ...inputStyle, minHeight: 56, resize: "vertical" }} placeholder="Qism tavsifi (AI to'ldirishi mumkin)" value={ep.description} onChange={(e) => update(i, "description", e.target.value)} />
            </div>
            {ep.id && <p className="mt-2 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}><Eye className="h-3 w-3" /> Qism ko&apos;rishlari alohida hisoblanadi.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
