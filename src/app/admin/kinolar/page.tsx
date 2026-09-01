"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Edit3,
  Eye,
  Filter,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AdminStat } from "@/components/admin/AdminUi";
import { formatViewCount } from "@/lib/utils";
import type { Movie } from "@/types/movie";

const TYPE_LABELS: Record<string, string> = {
  MOVIE: "Kino",
  SERIAL: "Serial",
  CARTOON: "Multfilm",
  DOCUMENTARY: "Hujjatli",
  SHOW: "Shou",
};

const FILTERS = ["ALL", "MOVIE", "SERIAL", "CARTOON"] as const;

export default function AdminKinolarPage() {
  return (
    <Suspense fallback={<div className="admin-card p-8 text-center text-white">Yuklanmoqda...</div>}>
      <KinolarTable />
    </Suspense>
  );
}

function KinolarTable() {
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type") ?? "ALL";
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [manualType, setManualType] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDelete, setPendingDelete] = useState<Movie | null>(null);
  const [deleting, setDeleting] = useState(false);
  const typeFilter = manualType ?? urlType;

  useEffect(() => {
    let active = true;
    fetch("/api/movies")
      .then((response) => (response.ok ? response.json() : { movies: [] }))
      .then((data) => {
        if (active) setMovies(Array.isArray(data.movies) ? data.movies : []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uz");
    const result = movies.filter((movie) => {
      const matchesSearch =
        !query ||
        movie.title.toLocaleLowerCase("uz").includes(query) ||
        movie.originalTitle?.toLocaleLowerCase("uz").includes(query);
      return matchesSearch && (typeFilter === "ALL" || movie.type === typeFilter);
    });

    return result.sort((a, b) => {
      if (sort === "rating") return Number(b.imdbRating ?? 0) - Number(a.imdbRating ?? 0);
      if (sort === "views") return Number(b.viewCount ?? 0) - Number(a.viewCount ?? 0);
      if (sort === "title") return a.title.localeCompare(b.title, "uz");
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [movies, search, sort, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleMovies = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const publishedCount = movies.filter((movie) => movie.status === "PUBLISHED").length;
  const averageRating = movies.length
    ? movies.reduce((total, movie) => total + Number(movie.imdbRating ?? 0), 0) / movies.length
    : 0;
  const totalViews = movies.reduce((total, movie) => total + Number(movie.viewCount ?? 0), 0);

  const selectType = (type: string) => {
    setManualType(type);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/movies/${pendingDelete.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'chirishda xatolik");
      setMovies((current) => current.filter((movie) => movie.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Tarmoq xatosi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1450px] space-y-5">
      <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 xl:grid-cols-[minmax(320px,1fr)_auto_auto] xl:items-center">
        <div className="relative order-2 min-w-0 xl:order-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="admin-input h-12"
            style={{ paddingLeft: "3rem", paddingRight: "3rem" }}
            placeholder="Kinolarni qidirish..."
            aria-label="Kinolarni qidirish"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 grid min-h-10 min-w-10 -translate-y-1/2 place-items-center text-slate-400 hover:text-white"
              aria-label="Qidiruvni tozalash"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="order-1 col-span-2 grid grid-cols-4 overflow-hidden rounded-xl border border-white/10 bg-[#0b1324] xl:order-2 xl:col-span-1">
            {FILTERS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => selectType(type)}
                className={`min-h-12 px-3 text-sm font-semibold transition sm:px-5 ${
                  typeFilter === type
                    ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-[0_0_24px_rgba(168,85,247,.2)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {type === "ALL" ? "Barchasi" : TYPE_LABELS[type]}
              </button>
            ))}
        </div>
        <Link href="/admin/kinolar/yangi" className="admin-primary-button order-3 min-h-12 justify-center px-4 sm:px-6">
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Yangi qo&apos;shish</span>
          <span className="sm:hidden">Qo&apos;shish</span>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:hidden">
        <AdminStat icon={Clapperboard} label="Jami kontent" value={movies.length.toLocaleString("uz-UZ")} tone="violet" />
        <AdminStat icon={Star} label="O'rtacha reyting" value={averageRating.toFixed(1)} tone="yellow" />
        <AdminStat icon={Eye} label="Jami ko'rishlar" value={formatViewCount(totalViews)} tone="cyan" />
        <AdminStat icon={Clapperboard} label="Nashr qilingan" value={publishedCount.toLocaleString("uz-UZ")} tone="green" />
      </section>

      <section className="admin-card overflow-hidden">
        <header className="flex flex-col gap-3 border-b border-white/[.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Kinolar ro&apos;yxati</h1>
            <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
              {filtered.length} ta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="admin-input h-10 w-full sm:w-52"
              aria-label="Saralash"
            >
              <option value="newest">Yangi qo&apos;shilgan</option>
              <option value="rating">Reyting bo&apos;yicha</option>
              <option value="views">Ko&apos;rishlar bo&apos;yicha</option>
              <option value="title">Nomi bo&apos;yicha</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="grid min-h-72 place-items-center text-sm text-slate-400">Kontent yuklanmoqda...</div>
        ) : visibleMovies.length === 0 ? (
          <div className="grid min-h-72 place-items-center px-4 text-center text-slate-400">
            <div>
              <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium text-slate-300">Hech narsa topilmadi</p>
              <p className="mt-1 text-sm">Qidiruv yoki filtrni o&apos;zgartirib ko&apos;ring.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px]">
                <thead className="bg-white/[.025] text-left text-xs font-semibold text-slate-400">
                  <tr>
                    {['#', 'Kino', 'Tur', 'Yil', 'Reyting', "Ko'rishlar", 'Holat', 'Amallar'].map((label) => (
                      <th key={label} className="px-5 py-3.5">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleMovies.map((movie, index) => (
                    <tr key={movie.id} className="border-t border-white/[.055] transition hover:bg-white/[.025]">
                      <td className="px-5 py-1.5 text-sm text-slate-500">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-5 py-1.5">
                        <MovieIdentity movie={movie} compact />
                      </td>
                      <td className="px-5 py-1.5"><TypeBadge type={movie.type} /></td>
                      <td className="px-5 py-1.5 text-sm text-slate-200">{movie.year}</td>
                      <td className="px-5 py-1.5"><Rating value={movie.imdbRating} /></td>
                      <td className="px-5 py-1.5 text-sm text-slate-300">{formatViewCount(movie.viewCount ?? 0)}</td>
                      <td className="px-5 py-1.5"><StatusBadge movie={movie} /></td>
                      <td className="px-5 py-1.5"><RowActions movie={movie} onDelete={setPendingDelete} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 p-3 lg:hidden">
              {visibleMovies.map((movie) => (
                <article key={movie.id} className="rounded-xl border border-white/[.07] bg-[#091225]/80 p-3">
                  <div className="flex gap-3">
                    <MovieIdentity movie={movie} />
                    <div className="ml-auto shrink-0"><RowActions movie={movie} onDelete={setPendingDelete} /></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[.06] pt-3">
                    <TypeBadge type={movie.type} />
                    <span className="text-xs text-slate-400">{movie.year}</span>
                    <Rating value={movie.imdbRating} />
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Eye className="h-3.5 w-3.5" />{formatViewCount(movie.viewCount ?? 0)}</span>
                    <span className="ml-auto"><StatusBadge movie={movie} /></span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <footer className="flex flex-col gap-4 border-t border-white/[.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length} ta natija
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-1">
              <PageButton label="Oldingi sahifa" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </PageButton>
              <span className="min-w-16 text-center text-sm text-slate-300">{currentPage} / {totalPages}</span>
              <PageButton label="Keyingi sahifa" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                <ChevronRight className="h-4 w-4" />
              </PageButton>
            </div>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="admin-input h-10 w-32"
              aria-label="Sahifadagi elementlar soni"
            >
              {[10, 20, 50].map((size) => <option key={size} value={size}>Sahifada: {size}</option>)}
            </select>
          </div>
        </footer>
      </section>

      {pendingDelete && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="admin-card w-full max-w-md p-6 shadow-2xl">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400"><Trash2 className="h-6 w-6" /></div>
            <h2 id="delete-title" className="text-xl font-bold text-white">Kontent o&apos;chirilsinmi?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              “{pendingDelete.title}” butunlay o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-300 hover:bg-white/5" onClick={() => setPendingDelete(null)} disabled={deleting}>Bekor qilish</button>
              <button type="button" className="min-h-11 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50" onClick={confirmDelete} disabled={deleting}>{deleting ? "O'chirilmoqda..." : "O'chirish"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MovieIdentity({ movie, compact = false }: { movie: Movie; compact?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${compact ? "min-w-64" : "flex-1"}`}>
      <div className={`${compact ? "h-12 w-8" : "h-[84px] w-16"} shrink-0 overflow-hidden rounded-lg bg-slate-900`}>
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl} alt="" width={compact ? 32 : 64} height={compact ? 48 : 84} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-slate-700"><Clapperboard className="h-5 w-5" /></div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white sm:text-[15px]">{movie.title}</p>
        {movie.originalTitle && <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">{movie.originalTitle}</p>}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const serial = type === "SERIAL";
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${serial ? "bg-pink-500/15 text-pink-400" : "bg-violet-500/15 text-violet-400"}`}>{TYPE_LABELS[type] ?? type}</span>;
}

function Rating({ value }: { value?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 sm:text-sm">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      {Number(value ?? 0).toFixed(1)}
    </span>
  );
}

function StatusBadge({ movie }: { movie: Movie }) {
  const comingSoon = Boolean(movie.isComingSoon);
  const published = movie.status === "PUBLISHED";
  const label = comingSoon ? "Tez kunda" : published ? "Nashr" : movie.status === "DRAFT" ? "Qoralama" : "Arxiv";
  const colors = comingSoon ? "bg-amber-500/10 text-amber-300" : published ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400";
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${colors}`}>{label}</span>;
}

function RowActions({ movie, onDelete }: { movie: Movie; onDelete: (movie: Movie) => void }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link href={movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`} target="_blank" className="admin-icon-button" aria-label={`${movie.title} sahifasini ko'rish`} title="Ko'rish"><Eye className="h-4 w-4" /></Link>
      <Link href={`/admin/kinolar/${movie.id}`} className="admin-icon-button text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10" aria-label={`${movie.title}ni tahrirlash`} title="Tahrirlash"><Edit3 className="h-4 w-4" /></Link>
      <button type="button" onClick={() => onDelete(movie)} className="admin-icon-button text-red-400 hover:border-red-500/30 hover:bg-red-500/10" aria-label={`${movie.title}ni o'chirish`} title="O'chirish"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function PageButton({ children, disabled, label, onClick }: { children: ReactNode; disabled: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="admin-icon-button disabled:cursor-not-allowed disabled:opacity-30" aria-label={label}>{children}</button>;
}
