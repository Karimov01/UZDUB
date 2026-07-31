"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Plus, Heart, Star, Clock, Eye, Globe, Calendar, Film, Mic, Check } from "lucide-react";
import { formatDuration, formatViewCount } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { fadeInUp, staggerChildren } from "@/lib/animations";
import MovieCard from "@/components/movie/MovieCard";
import { useSavedList } from "@/hooks/useSavedList";
import ExpandableText from "@/components/ui/ExpandableText";
import EngagementPanel from "@/components/engagement/EngagementPanel";
import type { Movie } from "@/types/movie";

export default function KinoDetail({ movie, similarMovies = [] }: { movie: Movie; similarMovies?: Movie[] }) {
  const similar = similarMovies.filter(
    (m) => m.id !== movie.id && m.genres?.some((g) => movie.genres?.some((mg) => mg.id === g.id))
  ).slice(0, 6);

  const [views, setViews] = useState(movie.viewCount ?? 0);
  const fav = useSavedList("favorites");
  const later = useSavedList("watchLater");
  const isFav = fav.has(movie.id);
  const isLater = later.has(movie.id);

  // Ko'rishlar: sessiya davomida bir marta +1
  useEffect(() => {
    const k = `uzdub_viewed_${movie.id}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* ignore */
    }
    fetch(`/api/public/view/${movie.id}`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === "number") setViews(d.count);
      })
      .catch(() => {});
  }, [movie.id]);

  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Hero */}
      <div className="relative w-full" style={{ minHeight: "90vh" }}>
        {movie.backdropUrl && (
          <div className="absolute inset-0">
            <Image src={movie.backdropUrl} alt={movie.title} fill priority className="object-cover object-top" sizes="100vw" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.7) 55%, rgba(10,10,15,0.3) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.4) 40%, transparent 70%)" }} />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-12 pb-16 flex gap-10 items-end min-h-[90vh]">
          {/* Poster */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:block shrink-0">
            <div className="w-56 rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid var(--border)" }}>
              {movie.posterUrl ? (
                <Image src={movie.posterUrl} alt={movie.title} width={224} height={336} className="object-cover w-full" />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
                  <Film className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="flex-1 max-w-2xl">
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-4">
              {movie.genres?.map((g) => <Badge key={g.id} variant="purple">{g.name}</Badge>)}
              {movie.year && <Badge variant="default">{movie.year}</Badge>}
              {movie.isPremium && <Badge variant="yellow">Premium</Badge>}
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              {movie.title}
            </motion.h1>
            {movie.originalTitle && (
              <motion.p variants={fadeInUp} className="text-base mb-4" style={{ color: "var(--text-muted)" }}>
                {movie.originalTitle}
              </motion.p>
            )}

            <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-5 flex-wrap">
              {movie.imdbRating && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)" }}>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{movie.imdbRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">IMDb</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Eye className="h-4 w-4" />
                {formatViewCount(views)}{" "}ko&apos;rildi
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mb-6 max-w-xl">
              <ExpandableText
                text={movie.description}
                className="text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              />
            </motion.div>

            {/* Meta grid */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: Calendar, label: "Yil", value: movie.year?.toString() },
                { icon: Clock, label: "Davomiyligi", value: movie.duration ? formatDuration(movie.duration) : null },
                { icon: Globe, label: "Davlat", value: movie.country },
                { icon: Film, label: "Til", value: movie.language },
                { icon: Mic, label: "Dublyaj", value: movie.dubbing },
              ].filter((item) => item.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="h-3.5 w-3.5" style={{ color: "var(--accent-violet)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-3 flex-wrap">
              <Link href={`/kino/${movie.slug}/tomosha`}>
                <Button size="lg"><Play className="h-5 w-5 fill-white" />Tomosha qilish</Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => fav.toggle(movie.id)}
                style={isFav ? { background: "rgba(236,72,153,0.15)", borderColor: "rgba(236,72,153,0.5)", color: "#EC4899" } : undefined}
              >
                <Heart className={isFav ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                {isFav ? "Sevimlida" : "Sevimli"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => later.toggle(movie.id)}
                style={isLater ? { background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.5)", color: "#A78BFA" } : undefined}
              >
                {isLater ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {isLater ? "Ro'yxatda" : "Keyin ko'raman"}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <EngagementPanel content={movie} />

      {similar.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
          <h2 className="text-xl font-bold text-white mb-5" style={{ fontFamily: "var(--font-display)" }}>
            O&apos;xshash kinolar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {similar.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}
      <div className="h-12" />
    </div>
  );
}
