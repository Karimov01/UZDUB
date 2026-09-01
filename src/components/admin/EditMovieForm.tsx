"use client";

/* eslint-disable @next/next/no-img-element -- Admin preview runtime URL va native onError fallback talab qiladi. */

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, Loader2, Save, Trash2, Upload, Video, X } from "lucide-react";
import { AdminGenreChip, AdminToggle } from "@/components/admin/AdminUi";
import EpisodeManager, { type EpisodeForm } from "@/components/admin/EpisodeManager";
import type { Movie } from "@/types/movie";

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
    genres: (movie.genres ?? []).map((genre) => genre.name),
    isFeatured: Boolean(movie.isFeatured),
    isTrending: Boolean(movie.isTrending),
    isPremium: Boolean(movie.isPremium),
    isComingSoon: Boolean(movie.isComingSoon),
    isRussian: Boolean(movie.isRussian),
    isTrailer: Boolean(movie.isTrailer),
    episodes: (movie.episodes ?? []).map((episode): EpisodeForm => ({
      id: episode.id,
      season: String(episode.season ?? 1),
      episode: String(episode.episode ?? 1),
      title: episode.title ?? "",
      description: episode.description ?? "",
      videoUrl: episode.videoUrl ?? "",
      duration: episode.duration ? String(episode.duration) : "",
      aiProcessedAt: episode.aiProcessedAt,
    })),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<"posterUrl" | "backdropUrl" | null>(null);
  const [genresAvailable, setGenresAvailable] = useState(GENRES);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const toggleGenre = (genre: string) => set("genres", form.genres.includes(genre) ? form.genres.filter((item) => item !== genre) : [...form.genres, genre]);

  useEffect(() => {
    fetch("/api/genres")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.genres) && data.genres.length) setGenresAvailable(data.genres.map((genre: { name: string }) => genre.name));
      })
      .catch(() => {});
  }, []);

  const handleFile = (key: "posterUrl" | "backdropUrl") => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Faqat rasm faylini tanlang");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set(key, reader.result as string);
    reader.readAsDataURL(file);
    setUploadingKey(key);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Rasm yuklanmadi");
      set(key, json.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Rasm yuklanmadi");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async (statusOverride?: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    if (!editable || saving) return;
    if (!form.title.trim()) {
      setError("Nomini kiriting");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: statusOverride ?? form.status,
          year: form.year ? Number(form.year) : undefined,
          duration: form.duration ? Number(form.duration) : undefined,
          imdbRating: form.imdbRating ? Number(form.imdbRating) : undefined,
          episodes: form.type === "SERIAL" ? form.episodes.map((episode) => ({
            id: episode.id,
            season: Number(episode.season) || 1,
            episode: Number(episode.episode) || 1,
            title: episode.title,
            description: episode.description,
            videoUrl: episode.videoUrl,
            duration: episode.duration ? Number(episode.duration) : undefined,
            aiProcessedAt: episode.aiProcessedAt,
          })) : [],
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Saqlashda xatolik");
      setSaved(true);
      router.push("/admin/kinolar");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Saqlashda xatolik");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editable || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/movies/${movie.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "O'chirishda xatolik");
      router.push("/admin/kinolar");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "O'chirishda xatolik");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1450px]">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/admin/kinolar" className="admin-icon-button" aria-label="Kinolar ro'yxatiga qaytish"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-white sm:text-2xl">Kinoni tahrirlash</h1>
          <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">{movie.title}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editable && (
            <button type="button" onClick={() => setDeleteOpen(true)} disabled={saving || deleting} className="hidden min-h-11 items-center gap-2 rounded-xl border border-red-500/40 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50 sm:flex">
              <Trash2 className="h-4 w-4" /> O&apos;chirish
            </button>
          )}
          <button type="button" onClick={() => handleSave("DRAFT")} disabled={!editable || saving} className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50 lg:flex">
            <Save className="h-4 w-4" /> Qoralamaga saqlash
          </button>
          <button type="button" onClick={() => handleSave()} disabled={!editable || saving} className="admin-primary-button min-h-11 px-5 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? "Saqlandi" : saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </header>

      {!editable && <Notice tone="amber">Bu namuna kontent. Uni tahrirlash yoki o&apos;chirish mumkin emas.</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      <fieldset disabled={!editable} className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,.92fr)]" style={{ opacity: editable ? 1 : 0.65 }}>
        <div className="space-y-5">
          <FormSection number="1" title="Asosiy ma'lumotlar">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="O'zbek nomi" required><input className="admin-input" value={form.title} onChange={(event) => set("title", event.target.value)} /></Field>
              <Field label="Asl nomi"><input className="admin-input" value={form.originalTitle} onChange={(event) => set("originalTitle", event.target.value)} /></Field>
            </div>
            <Field label="Tavsif" required>
              <div className="relative">
                <textarea className="admin-input min-h-32 resize-y pb-8" maxLength={5000} value={form.description} onChange={(event) => set("description", event.target.value)} />
                <span className="absolute bottom-3 right-3 text-[11px] text-slate-600">{form.description.length} / 5000</span>
              </div>
            </Field>
          </FormSection>

          <FormSection number="2" title="Tafsilotlar">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Tur" required><select className="admin-input" value={form.type} onChange={(event) => set("type", event.target.value)}><option value="MOVIE">Kino</option><option value="SERIAL">Serial</option><option value="CARTOON">Multfilm</option><option value="DOCUMENTARY">Hujjatli</option></select></Field>
              <Field label="Yil" required><input className="admin-input" type="number" value={form.year} onChange={(event) => set("year", event.target.value)} /></Field>
              <Field label="Davomiyligi (daq.)"><input className="admin-input" type="number" value={form.duration} onChange={(event) => set("duration", event.target.value)} /></Field>
              <Field label="Davlat"><input className="admin-input" value={form.country} onChange={(event) => set("country", event.target.value)} /></Field>
              <Field label="Asl tili"><input className="admin-input" value={form.language} onChange={(event) => set("language", event.target.value)} /></Field>
              <Field label="Dublyaj tili"><input className="admin-input" value={form.dubbing} onChange={(event) => set("dubbing", event.target.value)} /></Field>
              <Field label="IMDb reyting"><input className="admin-input" type="number" min="0" max="10" step="0.1" value={form.imdbRating} onChange={(event) => set("imdbRating", event.target.value)} /></Field>
            </div>
          </FormSection>

          <FormSection number="3" title="Video havolalari" icon={<Video className="h-4 w-4 text-violet-400" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Video havolasi (m3u8 / mp4)" required><input className="admin-input" type="url" value={form.videoUrl} onChange={(event) => set("videoUrl", event.target.value)} /></Field>
              <Field label="Treyler havolasi"><input className="admin-input" type="url" value={form.trailerUrl} onChange={(event) => set("trailerUrl", event.target.value)} /></Field>
            </div>
          </FormSection>

          <FormSection number="4" title="Janrlar">
            <div className="flex flex-wrap gap-2">
              {genresAvailable.map((genre) => <AdminGenreChip key={genre} selected={form.genres.includes(genre)} onClick={() => toggleGenre(genre)}>{genre}</AdminGenreChip>)}
            </div>
          </FormSection>

          {form.type === "SERIAL" && <EpisodeManager episodes={form.episodes} onChange={(episodes) => set("episodes", episodes)} serialTitle={form.title} originalTitle={form.originalTitle} />}
        </div>

        <div className="space-y-5">
          <FormSection title="Rasmlar" icon={<ImagePlus className="h-4 w-4 text-violet-400" />}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ImageUpload label="Poster" hint="Tavsiya: 500 × 750px" ratio="aspect-[2/3]" value={form.posterUrl} uploading={uploadingKey === "posterUrl"} inputRef={posterInputRef} onFile={handleFile("posterUrl")} onClear={() => set("posterUrl", "")} />
              <ImageUpload label="Backdrop" hint="Tavsiya: 1280 × 720px" ratio="aspect-video" value={form.backdropUrl} uploading={uploadingKey === "backdropUrl"} inputRef={backdropInputRef} onFile={handleFile("backdropUrl")} onClear={() => set("backdropUrl", "")} />
            </div>
          </FormSection>

          <FormSection title="Holat va sozlamalar">
            <Field label="Holat" required><select className="admin-input text-emerald-400" value={form.status} onChange={(event) => set("status", event.target.value)}><option value="DRAFT">Qoralama</option><option value="PUBLISHED">Nashr etilgan</option><option value="ARCHIVED">Arxivlangan</option></select></Field>
            <div className="grid gap-x-5 sm:grid-cols-2">
              <AdminToggle checked={form.isFeatured} onChange={() => set("isFeatured", !form.isFeatured)} label="Hero bannerda" description="Bosh sahifada hero bo'limida" />
              <AdminToggle checked={form.isComingSoon} onChange={() => set("isComingSoon", !form.isComingSoon)} label="Tez kunda" description="Faqat tez kunda katalogida" />
              <AdminToggle checked={form.isTrending} onChange={() => set("isTrending", !form.isTrending)} label="Trendda" description="Trendlar qismida ko'rsatish" />
              <AdminToggle checked={form.isRussian} onChange={() => set("isRussian", !form.isRussian)} label="Rus tilida" description="Rus tilidagi kontent mavjud" />
              <AdminToggle checked={form.isPremium} onChange={() => set("isPremium", !form.isPremium)} label="Premium" description="Faqat premium foydalanuvchilar" />
              <AdminToggle checked={form.isTrailer} onChange={() => set("isTrailer", !form.isTrailer)} label="Treyler" description="Player ustida treyler belgisi" />
            </div>
            {form.isComingSoon && <div className="rounded-xl border border-violet-400/15 bg-violet-500/[.07] px-4 py-3 text-xs leading-5 text-slate-400">Tez kunda yoqilgan material normal Kino va Serial bo&apos;limlarida ko&apos;rinmaydi.</div>}
          </FormSection>
        </div>
      </fieldset>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070b15]/90 p-3 shadow-2xl sm:hidden">
        <button type="button" onClick={() => setDeleteOpen(true)} disabled={!editable || saving} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-red-500/40 text-red-400" aria-label="Kontentni o'chirish"><Trash2 className="h-4 w-4" /></button>
        <button type="button" onClick={() => handleSave()} disabled={!editable || saving} className="admin-primary-button min-h-11 flex-1 justify-center disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-delete-title">
          <div className="admin-card w-full max-w-md p-6">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400"><Trash2 className="h-6 w-6" /></div>
            <h2 id="edit-delete-title" className="text-xl font-bold text-white">“{movie.title}” o&apos;chirilsinmi?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Kontent va unga bog&apos;liq ma&apos;lumotlar o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteOpen(false)} disabled={deleting} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-300 hover:bg-white/5">Bekor qilish</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white disabled:opacity-50">{deleting && <Loader2 className="h-4 w-4 animate-spin" />}{deleting ? "O'chirilmoqda..." : "O'chirish"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({ number, title, icon, children }: { number?: string; title: string; icon?: ReactNode; children: ReactNode }) {
  return <section className="admin-card space-y-4 p-4 sm:p-5"><h2 className="flex items-center gap-2 text-[15px] font-bold text-white">{number && <span className="grid h-6 w-6 place-items-center rounded-full border border-violet-400/40 bg-violet-500/10 text-xs text-violet-300">{number}</span>}{icon}{title}</h2>{children}</section>;
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-xs font-medium text-slate-400">{label}{required && <span className="ml-1 text-pink-500">*</span>}<span className="mt-2 block">{children}</span></label>;
}

function Notice({ tone, children }: { tone: "amber" | "red"; children: ReactNode }) {
  return <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${tone === "red" ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}`}>{children}</div>;
}

function ImageUpload({ label, hint, ratio, value, uploading, inputRef, onFile, onClear }: { label: string; hint: string; ratio: string; value: string; uploading: boolean; inputRef: React.RefObject<HTMLInputElement | null>; onFile: (event: ChangeEvent<HTMLInputElement>) => void; onClear: () => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-400">{label}</p><span className="text-[10px] text-slate-600">{hint}</span></div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      {value ? (
        <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#070b15] ${ratio}`}>
          <img src={value} alt={`${label} ko'rinishi`} className="h-full w-full object-cover" onError={(event) => (event.currentTarget.style.display = "none")} />
          <button type="button" onClick={onClear} className="absolute right-2 top-2 grid min-h-9 min-w-9 place-items-center rounded-full bg-red-500 text-white shadow-lg" aria-label={`${label}ni olib tashlash`}><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className={`grid w-full place-items-center rounded-xl border border-dashed border-white/15 bg-[#070b15] text-slate-500 transition hover:border-violet-400/50 hover:text-violet-300 ${ratio}`}>
          <span className="flex flex-col items-center gap-2"><Upload className="h-6 w-6" /><span className="text-sm font-medium">{uploading ? "Yuklanmoqda..." : `${label} tanlash`}</span></span>
        </button>
      )}
      {value && <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 text-xs font-semibold text-violet-300 hover:bg-violet-500/10"><Upload className="h-4 w-4" />{uploading ? "Yuklanmoqda..." : `${label}ni almashtirish`}</button>}
    </div>
  );
}
