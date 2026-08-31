"use client";

/* eslint-disable @next/next/no-img-element -- Admin preview runtime URL va native onError fallback talab qiladi. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Trash2, Loader2, Video, Upload, X } from "lucide-react";
import type { Movie } from "@/types/movie";
import EpisodeManager, { type EpisodeForm } from "@/components/admin/EpisodeManager";

const GENRES = ["Drama", "Harakatli", "Triller", "Ilmiy fantastika", "Fantastik", "Jinoyat", "Komediya", "Romantik", "Tarix", "Multfilm", "Dahshat", "Musiqa"];

export default function EditMovieForm({ movie, editable }: { movie: Movie; editable: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: movie.title ?? "",
    originalTitle: movie.originalTitle ?? "",
    type: movie.type ?? "MOVIE",
    year: movie.year ? String(movie.year) : "",
    duration: movie.duration ? String(movie.duration) : "",
    country: movie.country ?? "",
    language: movie.language ?? "",
    dubbing: movie.dubbing ?? "",
    imdbRating: movie.imdbRating ? String(movie.imdbRating) : "",
    description: movie.description ?? "",
    shortDesc: movie.shortDesc ?? "",
    posterUrl: movie.posterUrl ?? "",
    backdropUrl: movie.backdropUrl ?? "",
    videoUrl: movie.videoUrl ?? "",
    trailerUrl: movie.trailerUrl ?? "",
    status: movie.status ?? "DRAFT",
    genres: (movie.genres ?? []).map((g) => g.name),
    isFeatured: !!movie.isFeatured,
    isTrending: !!movie.isTrending,
    isPremium: !!movie.isPremium,
    isComingSoon: !!movie.isComingSoon,
    isRussian: !!movie.isRussian,
    episodes: (movie.episodes ?? []).map((e): EpisodeForm => ({
      id: e.id,
      season: String(e.season ?? 1),
      episode: String(e.episode ?? 1),
      title: e.title ?? "",
      description: e.description ?? "",
      videoUrl: e.videoUrl ?? "",
      duration: e.duration ? String(e.duration) : "",
      aiProcessedAt: e.aiProcessedAt,
    })),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<"posterUrl" | "backdropUrl" | null>(null);
  const [genresAvailable, setGenresAvailable] = useState(GENRES);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));
  const toggleGenre = (g: string) =>
    set("genres", form.genres.includes(g) ? form.genres.filter((x) => x !== g) : [...form.genres, g]);
  useEffect(() => { fetch("/api/genres").then((response) => response.json()).then((data) => { if (Array.isArray(data.genres) && data.genres.length) setGenresAvailable(data.genres.map((genre: { name: string }) => genre.name)); }).catch(() => {}); }, []);
  const handleFile = (key: "posterUrl" | "backdropUrl") => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !file.type.startsWith("image/")) { setError("Faqat rasm faylini tanlang"); return; }
    const reader = new FileReader(); reader.onload = () => set(key, reader.result as string); reader.readAsDataURL(file); setUploadingKey(key); setError("");
    try { const data = new FormData(); data.append("file", file); const response = await fetch("/api/upload", { method: "POST", body: data }); const json = await response.json(); if (!response.ok) throw new Error(json.error || "Rasm yuklanmadi"); set(key, json.url); } catch (error) { setError(error instanceof Error ? error.message : "Rasm yuklanmadi"); } finally { setUploadingKey(null); }
  };

  const handleSave = async () => {
    if (!editable) return;
    if (!form.title.trim()) { setError("Nomini kiriting"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : undefined,
          duration: form.duration ? Number(form.duration) : undefined,
          imdbRating: form.imdbRating ? Number(form.imdbRating) : undefined,
          episodes: form.type === "SERIAL"
            ? form.episodes.map((e) => ({
                id: e.id,
                season: Number(e.season) || 1,
                episode: Number(e.episode) || 1,
                title: e.title,
                description: e.description,
                videoUrl: e.videoUrl,
                duration: e.duration ? Number(e.duration) : undefined,
                aiProcessedAt: e.aiProcessedAt,
              }))
            : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Saqlashda xatolik");
      setSaved(true);
      router.push("/admin/kinolar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saqlashda xatolik");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editable) return;
    if (!confirm(`"${movie.title}" o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/movies/${movie.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "O'chirishda xatolik");
      router.push("/admin/kinolar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "O'chirishda xatolik");
      setDeleting(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none";
  const inputStyle = { background: "var(--bg-primary)", border: "1px solid var(--border)" };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/kinolar" className="p-2 rounded-xl transition-all hover:bg-white/8" style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Kinoni tahrirlash</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{movie.title}</p>
        </div>
        <div className="ml-auto flex gap-3">
          {editable && (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10 disabled:opacity-60"
              style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444" }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              O&apos;chirish
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!editable || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: saved ? "#10B981" : "linear-gradient(135deg, #7C3AED, #EC4899)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? "Saqlandi!" : saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>

      {!editable && (
        <div className="mb-5 text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
          Bu <b>namuna</b> kino (demo). Uni tahrirlab yoki o&apos;chirib bo&apos;lmaydi — faqat siz qo&apos;shgan kinolar tahrirlanadi.
        </div>
      )}
      {error && (
        <div className="mb-5 text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>{error}</div>
      )}

      <fieldset disabled={!editable} className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ opacity: editable ? 1 : 0.6 }}>
        <div className="lg:col-span-2 space-y-5">
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm">Asosiy ma&apos;lumotlar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>O&apos;zbek nomi *</label>
                <input className={inputClass} style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Asl nomi</label>
                <input className={inputClass} style={inputStyle} value={form.originalTitle} onChange={(e) => set("originalTitle", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Tavsif</label>
              <textarea className={inputClass} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>

          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm">Tafsilotlar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Tur</label>
                <select className={inputClass} style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="MOVIE">Kino</option>
                  <option value="SERIAL">Serial</option>
                  <option value="CARTOON">Multfilm</option>
                  <option value="DOCUMENTARY">Hujjatli</option>
                </select>
              </div>
              <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Yil</label><input className={inputClass} style={inputStyle} type="number" value={form.year} onChange={(e) => set("year", e.target.value)} /></div>
              <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Davomiyligi</label><input className={inputClass} style={inputStyle} type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} /></div>
              <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Davlat</label><input className={inputClass} style={inputStyle} value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
              <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Asl til</label><input className={inputClass} style={inputStyle} value={form.language} onChange={(e) => set("language", e.target.value)} /></div>
              <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Dublyaj</label><input className={inputClass} style={inputStyle} value={form.dubbing} onChange={(e) => set("dubbing", e.target.value)} /></div>
              <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>IMDb</label><input className={inputClass} style={inputStyle} type="number" step="0.1" value={form.imdbRating} onChange={(e) => set("imdbRating", e.target.value)} /></div>
            </div>
          </div>

          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="flex items-center gap-2 font-semibold text-white text-sm"><Video className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />Video havolalari</h3>
            <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Video havolasi (.m3u8 / .mp4)</label><input className={inputClass} style={inputStyle} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} /></div>
            <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Treyler havolasi</label><input className={inputClass} style={inputStyle} value={form.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} /></div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm mb-4">Janrlar</h3>
            <div className="flex flex-wrap gap-2">
              {genresAvailable.map((g) => (
                <button key={g} type="button" onClick={() => toggleGenre(g)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: form.genres.includes(g) ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--bg-primary)", color: form.genres.includes(g) ? "#fff" : "var(--text-muted)", border: form.genres.includes(g) ? "none" : "1px solid var(--border)" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {form.type === "SERIAL" && (
            <EpisodeManager
              episodes={form.episodes}
              onChange={(eps) => set("episodes", eps)}
              serialTitle={form.title}
              originalTitle={form.originalTitle}
            />
          )}
        </div>

        <div className="space-y-5">
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm">Rasmlar</h3>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Poster (kompyuterdan yuklash)</label>
              <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile("posterUrl")} />
              <button type="button" onClick={() => posterInputRef.current?.click()} className="w-full px-3 py-2 rounded-xl text-sm flex items-center justify-center gap-2" style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}><Upload className="h-4 w-4" />{uploadingKey === "posterUrl" ? "Yuklanmoqda..." : "Poster tanlash"}</button>
              {form.posterUrl && (
                <div className="relative"><img src={form.posterUrl} alt="poster" className="mt-2 w-full aspect-[2/3] object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = "none")} /><button type="button" onClick={() => set("posterUrl", "")} className="absolute right-2 top-2 p-1 rounded bg-red-500 text-white"><X className="h-3.5 w-3.5" /></button></div>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Backdrop (kompyuterdan yuklash)</label>
              <input ref={backdropInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile("backdropUrl")} />
              <button type="button" onClick={() => backdropInputRef.current?.click()} className="w-full px-3 py-2 rounded-xl text-sm flex items-center justify-center gap-2" style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}><Upload className="h-4 w-4" />{uploadingKey === "backdropUrl" ? "Yuklanmoqda..." : "Backdrop tanlash"}</button>
              {form.backdropUrl && <div className="relative"><img src={form.backdropUrl} alt="backdrop" className="mt-2 w-full aspect-video object-cover rounded-lg" /><button type="button" onClick={() => set("backdropUrl", "")} className="absolute right-2 top-2 p-1 rounded bg-red-500 text-white"><X className="h-3.5 w-3.5" /></button></div>}
            </div>
          </div>

          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm">Holat va sozlamalar</h3>
            <select className={inputClass} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="DRAFT">Qoralama</option>
              <option value="PUBLISHED">Nashr etilgan</option>
              <option value="ARCHIVED">Arxivlangan</option>
            </select>
            <div className="space-y-3">
              {[{ key: "isFeatured", label: "Hero bannerda" }, { key: "isTrending", label: "Trendda" }, { key: "isPremium", label: "Premium" }, { key: "isComingSoon", label: "Tez kunda" }, { key: "isRussian", label: "Rus tilida" }].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-9 h-5 rounded-full relative transition-all" style={{ background: (form as Record<string, unknown>)[key] ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--bg-primary)", border: "1px solid var(--border)" }} onClick={() => set(key, !(form as Record<string, unknown>)[key])}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: (form as Record<string, unknown>)[key] ? "calc(100% - 18px)" : "2px" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
                </label>
              ))}
              {form.isComingSoon ? <p className="pl-12 text-xs leading-5" style={{ color: "var(--text-muted)" }}>Tez kunda yoqilsa material normal Kino va Serial bo&apos;limlarida ko&apos;rinmaydi.</p> : null}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
