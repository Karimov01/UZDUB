"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Image as ImageIcon, Sparkles, Loader2, Upload, X, Video } from "lucide-react";

const GENRES = ["Drama", "Harakatli", "Triller", "Ilmiy fantastika", "Fantastik", "Jinoyat", "Komediya", "Romantik", "Tarix", "Multfilm", "Dahshat", "Musiqa"];

export default function YangiKinoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", originalTitle: "", type: "MOVIE", year: "", duration: "",
    country: "", language: "Ingliz", dubbing: "O'zbek", imdbRating: "",
    description: "", posterUrl: "", backdropUrl: "", videoUrl: "", trailerUrl: "", status: "DRAFT",
    genres: [] as string[], isFeatured: false, isTrending: false, isPremium: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [uploadingKey, setUploadingKey] = useState<"posterUrl" | "backdropUrl" | null>(null);

  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const toggleGenre = (g: string) => {
    set("genres", form.genres.includes(g) ? form.genres.filter((x) => x !== g) : [...form.genres, g]);
  };

  // AI avtomatik to'ldirish — faqat nomi/asl nomi/yili asosida qolgan maydonlarni to'ldiradi
  const handleAiFill = async () => {
    if (!form.title && !form.originalTitle) {
      setAiError("Avval kamida nomi yoki asl nomini kiriting");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, originalTitle: form.originalTitle, year: form.year }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI xatosi");
      const d = json.data;
      setForm((p) => ({
        ...p,
        description: d.description ?? p.description,
        type: d.type ?? p.type,
        country: d.country ?? p.country,
        language: d.language ?? p.language,
        dubbing: d.dubbing ?? p.dubbing,
        duration: d.duration != null ? String(d.duration) : p.duration,
        imdbRating: d.imdbRating != null ? String(d.imdbRating) : p.imdbRating,
        genres: Array.isArray(d.genres) && d.genres.length ? d.genres.filter((g: string) => GENRES.includes(g)) : p.genres,
      }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI xatosi");
    } finally {
      setAiLoading(false);
    }
  };

  // Kompyuterdan rasm tanlash: darhol optimistik ko'rsatiladi, so'ng serverga yuklanib real URL saqlanadi
  const handleFile = (key: "posterUrl" | "backdropUrl") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAiError("Faqat rasm fayllari qo'llab-quvvatlanadi");
      return;
    }
    setAiError("");

    // Optimistik oldindan ko'rish
    const reader = new FileReader();
    reader.onload = () => set(key, reader.result as string);
    reader.readAsDataURL(file);

    // Serverga yuklash
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Yuklashda xatolik");
      set(key, json.url); // data URL o'rniga real server URL
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Yuklashda xatolik");
      set(key, ""); // muvaffaqiyatsiz bo'lsa tozalaymiz
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setAiError("O'zbek nomini kiriting");
      return;
    }
    if (uploadingKey) {
      setAiError("Rasm yuklanmoqda, biroz kuting");
      return;
    }
    setSaving(true);
    setAiError("");
    // data: URL (yuklanmagan) o'rniga bo'sh yuboriladi
    const clean = (u: string) => (u.startsWith("data:") ? "" : u);
    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          posterUrl: clean(form.posterUrl),
          backdropUrl: clean(form.backdropUrl),
          year: form.year ? Number(form.year) : undefined,
          duration: form.duration ? Number(form.duration) : undefined,
          imdbRating: form.imdbRating ? Number(form.imdbRating) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Saqlashda xatolik");
      setSaved(true);
      router.push("/admin/kinolar");
      router.refresh();
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Saqlashda xatolik");
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1";
  const inputStyle = { background: "var(--bg-primary)", border: "1px solid var(--border)", fontFamily: "var(--font-body)" };
  const focusStyle = { "--tw-ring-color": "var(--accent-violet)" } as React.CSSProperties;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/kinolar" className="p-2 rounded-xl transition-all hover:bg-white/8" style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Yangi kino qo&apos;shish
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nomi va yilini kiriting, qolganini AI to&apos;ldiradi</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button
            onClick={() => set("status", "DRAFT")}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/8"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Qoralama
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: saved ? "#10B981" : "linear-gradient(135deg, #7C3AED, #EC4899)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? "Saqlandi!" : saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Asosiy ma&apos;lumotlar</h3>
              <button
                onClick={handleAiFill}
                disabled={aiLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
                title="Nomi va yili asosida barcha maydonlarni AI to'ldiradi"
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiLoading ? "To'ldirilmoqda..." : "AI bilan to'ldirish"}
              </button>
            </div>
            {aiError && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>
                {aiError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>O&apos;zbek nomi *</label>
                <input className={inputClass} style={{ ...inputStyle, ...focusStyle }} placeholder="Yulduzlararo" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Asl nomi</label>
                <input className={inputClass} style={{ ...inputStyle, ...focusStyle }} placeholder="Interstellar" value={form.originalTitle} onChange={(e) => set("originalTitle", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Tavsif *</label>
              <textarea
                className={inputClass}
                style={{ ...inputStyle, ...focusStyle, minHeight: 100, resize: "vertical" }}
                placeholder="Film haqida qisqacha ma'lumot... (AI to'ldirishi mumkin)"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>

          {/* Details */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Tafsilotlar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Tur *</label>
                <select className={inputClass} style={{ ...inputStyle }} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="MOVIE">Kino</option>
                  <option value="SERIAL">Serial</option>
                  <option value="CARTOON">Multfilm</option>
                  <option value="DOCUMENTARY">Hujjatli</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Yil *</label>
                <input className={inputClass} style={{ ...inputStyle }} type="number" placeholder="2024" min="1900" max="2030" value={form.year} onChange={(e) => set("year", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Davomiyligi (daq)</label>
                <input className={inputClass} style={{ ...inputStyle }} type="number" placeholder="120" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Davlat</label>
                <input className={inputClass} style={{ ...inputStyle }} placeholder="AQSh" value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Asl til</label>
                <input className={inputClass} style={{ ...inputStyle }} placeholder="Ingliz" value={form.language} onChange={(e) => set("language", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Dublyaj tili</label>
                <input className={inputClass} style={{ ...inputStyle }} placeholder="O'zbek" value={form.dubbing} onChange={(e) => set("dubbing", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>IMDb reyting</label>
                <input className={inputClass} style={{ ...inputStyle }} type="number" step="0.1" min="0" max="10" placeholder="8.5" value={form.imdbRating} onChange={(e) => set("imdbRating", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Video havolalari */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="flex items-center gap-2 font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>
              <Video className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
              Video havolalari
            </h3>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Video havolasi (asosiy fayl / HLS .m3u8)</label>
              <input className={inputClass} style={{ ...inputStyle, ...focusStyle }} placeholder="https://.../video.m3u8 yoki .mp4" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Treyler havolasi (ixtiyoriy)</label>
              <input className={inputClass} style={{ ...inputStyle, ...focusStyle }} placeholder="https://youtube.com/... yoki .mp4" value={form.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} />
            </div>
          </div>

          {/* Genres */}
          <div className="p-5 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>Janrlar</h3>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: form.genres.includes(g) ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--bg-primary)",
                    color: form.genres.includes(g) ? "#fff" : "var(--text-muted)",
                    border: form.genres.includes(g) ? "none" : "1px solid var(--border)",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Images */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Rasmlar</h3>

            {/* Poster upload */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Poster (kompyuterdan yuklang)</label>
              <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile("posterUrl")} />
              {form.posterUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.posterUrl} alt="poster" className="w-full aspect-[2/3] object-cover rounded-lg" />
                  {uploadingKey === "posterUrl" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: "rgba(0,0,0,0.7)" }}>
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <button onClick={() => posterInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                      O&apos;zgartirish
                    </button>
                    <button onClick={() => set("posterUrl", "")} className="p-1.5 rounded-lg text-white" style={{ background: "rgba(239,68,68,0.8)" }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => posterInputRef.current?.click()}
                  className="w-full aspect-[2/3] rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:border-violet-500"
                  style={{ background: "var(--bg-primary)", border: "1px dashed var(--border)" }}
                >
                  <Upload className="h-8 w-8 opacity-40" style={{ color: "var(--accent-violet)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rasmni tanlash</span>
                </button>
              )}
            </div>

            {/* Backdrop upload */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Backdrop (kompyuterdan yuklang)</label>
              <input ref={backdropInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile("backdropUrl")} />
              {form.backdropUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.backdropUrl} alt="backdrop" className="w-full aspect-video object-cover rounded-lg" />
                  {uploadingKey === "backdropUrl" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: "rgba(0,0,0,0.7)" }}>
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <button onClick={() => backdropInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                      O&apos;zgartirish
                    </button>
                    <button onClick={() => set("backdropUrl", "")} className="p-1.5 rounded-lg text-white" style={{ background: "rgba(239,68,68,0.8)" }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => backdropInputRef.current?.click()}
                  className="w-full aspect-video rounded-lg flex flex-col items-center justify-center gap-2 transition-all"
                  style={{ background: "var(--bg-primary)", border: "1px dashed var(--border)" }}
                >
                  <ImageIcon className="h-6 w-6 opacity-40" style={{ color: "var(--accent-violet)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rasmni tanlash</span>
                </button>
              )}
            </div>
          </div>

          {/* Status & options */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Holat va sozlamalar</h3>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Nashr holati</label>
              <select className={inputClass} style={{ ...inputStyle }} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DRAFT">Qoralama</option>
                <option value="PUBLISHED">Nashr etilgan</option>
                <option value="ARCHIVED">Arxivlangan</option>
              </select>
            </div>
            <div className="space-y-3">
              {[
                { key: "isFeatured", label: "Hero bannerda ko'rsatish" },
                { key: "isTrending", label: "Trendda ko'rsatish" },
                { key: "isPremium", label: "Premium kontent" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className="w-9 h-5 rounded-full relative transition-all"
                    style={{ background: (form as Record<string, unknown>)[key] ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--bg-primary)", border: "1px solid var(--border)" }}
                    onClick={() => set(key, !(form as Record<string, unknown>)[key])}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: (form as Record<string, unknown>)[key] ? "calc(100% - 18px)" : "2px" }}
                    />
                  </div>
                  <span className="text-sm group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
