"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Plus, Heart, Star, Eye, Film, Calendar, Globe, Mic, Tv, Check } from "lucide-react";
import { formatViewCount } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { fadeInUp, staggerChildren } from "@/lib/animations";
import MovieCard from "@/components/movie/MovieCard";
import { useSavedList } from "@/hooks/useSavedList";
import ExpandableText from "@/components/ui/ExpandableText";
import type { Movie } from "@/types/movie";
import SeasonEpisodeSelector, { normalizeEpisodes } from "@/components/serial/SeasonEpisodeSelector";

export default function SerialDetail({ serial, similarMovies = [] }: { serial: Movie; similarMovies?: Movie[] }) {
  const similar = similarMovies.slice(0, 6);

  const fav = useSavedList("favorites");
  const later = useSavedList("watchLater");
  const isFav = fav.has(serial.id);
  const isLater = later.has(serial.id);

  const episodes = normalizeEpisodes(serial.episodes ?? []);
  const firstEpisode = episodes[0];

  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Hero */}
      <div className="relative" style={{ minHeight: "70vh" }}>
        {serial.backdropUrl && (
          <div className="absolute inset-0">
            <Image src={serial.backdropUrl} alt={serial.title} fill priority className="object-cover object-top" sizes="100vw" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 60%, rgba(10,10,15,0.2) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,1) 0%, transparent 60%)" }} />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-14 flex gap-8 items-end min-h-[70vh]">
          <div className="hidden md:block shrink-0 w-44 rounded-xl overflow-hidden shadow-2xl" style={{ border: "1px solid var(--border)" }}>
            {serial.posterUrl ? (
              <Image src={serial.posterUrl} alt={serial.title} width={176} height={264} className="object-cover w-full" />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
                <Film className="h-10 w-10 text-gray-600" />
              </div>
            )}
          </div>

          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="flex-1 max-w-xl">
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-3">
              {serial.genres?.map((g) => <Badge key={g.id} variant="purple">{g.name}</Badge>)}
              {serial.year && <Badge variant="default">{serial.year}</Badge>}
              <Badge variant="pink">Serial</Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)" }}>
              {serial.title}
            </motion.h1>
            {serial.originalTitle && (
              <motion.p variants={fadeInUp} className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                {serial.originalTitle}
              </motion.p>
            )}

            <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-4 flex-wrap">
              {serial.imdbRating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(245,197,24,0.12)", border: "1px solid rgba(245,197,24,0.3)" }}>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{serial.imdbRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">IMDb</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Eye className="h-4 w-4" />
                {formatViewCount(serial.viewCount ?? 0)} ko&apos;rildi
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mb-4">
              <ExpandableText
                text={serial.description}
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              />
            </motion.div>

            {/* Meta */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-2 mb-5">
              {[
                { icon: Calendar, label: "Yil", value: serial.year?.toString() },
                { icon: Globe, label: "Davlat", value: serial.country },
                { icon: Tv, label: "Til", value: serial.language },
                { icon: Mic, label: "Dublyaj", value: serial.dubbing },
              ].filter((item) => item.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="px-3 py-2 rounded-xl" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="h-3.5 w-3.5" style={{ color: "var(--accent-violet)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex gap-3 flex-wrap">
              <Link href={firstEpisode ? `/serial/${serial.slug}/qism/${firstEpisode.season}/${firstEpisode.episode}` : `/serial/${serial.slug}/tomosha`}>
                <Button size="lg"><Play className="h-5 w-5 fill-white" />Ko&apos;rishni boshlash</Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => fav.toggle(serial.id)}
                style={isFav ? { background: "rgba(236,72,153,0.15)", borderColor: "rgba(236,72,153,0.5)", color: "#EC4899" } : undefined}
              >
                <Heart className={isFav ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                {isFav ? "Sevimlida" : "Sevimli"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => later.toggle(serial.id)}
                style={isLater ? { background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.5)", color: "#A78BFA" } : undefined}
              >
                {isLater ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {isLater ? "Ro'yxatda" : "Keyin ko'raman"}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {episodes.length > 0 && <SeasonEpisodeSelector slug={serial.slug} episodes={episodes} title={serial.title} />}

      {/* Similar serials */}
      {similar.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 pb-10">
          <h2 className="text-xl font-bold text-white mb-5" style={{ fontFamily: "var(--font-display)" }}>
            O&apos;xshash seriallar
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
