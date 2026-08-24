"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { HeroMovieData } from "@/types/movie";

interface HeroBannerProps {
  movies: HeroMovieData[];
}

function heroHref(movie: HeroMovieData) {
  return movie.type === "SERIAL" ? `/serial/${movie.slug}` : `/kino/${movie.slug}`;
}

function HeroCard({ movie, priority, onImageError }: { movie: HeroMovieData; priority?: boolean; onImageError: () => void }) {
  return (
    <Link
      href={heroHref(movie)}
      className="group relative block aspect-video overflow-hidden rounded-[22px] border border-white/15 bg-[#11131a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 md:aspect-[16/9] md:rounded-[24px]"
      aria-label={`${movie.title} haqida batafsil`}
    >
      {movie.backdropUrl ? (
        <Image
          src={optimizedTmdbImage(movie.backdropUrl, "backdrop")!}
          alt={movie.title}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 767px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
          onError={onImageError}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-950 to-black" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      {movie.imdbRating !== undefined ? (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur md:right-5 md:top-5 md:gap-2 md:px-3 md:py-1.5 md:text-sm">
          <span className="rounded-md bg-[#f5c518] px-1.5 py-0.5 text-[11px] font-black text-black md:text-xs">IMDb</span>
          {movie.imdbRating.toFixed(1)}
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
        <h1 className="line-clamp-2 text-[22px] font-extrabold leading-[1.12] text-white drop-shadow sm:text-2xl md:text-[28px]" style={{ fontFamily: "var(--font-display)" }}>{movie.title}</h1>
        <div className="mt-2.5 flex flex-nowrap gap-1.5 overflow-hidden text-xs text-white sm:text-sm md:mt-4 md:flex-wrap md:gap-2 md:text-base">
          {movie.genres?.[0]?.name ? <span className="shrink-0 rounded-lg border border-white/35 bg-black/25 px-2.5 py-1.5 backdrop-blur-sm md:rounded-xl md:px-3 md:py-2">{movie.genres[0].name}</span> : null}
          {movie.year ? <span className="shrink-0 rounded-lg border border-white/35 bg-black/25 px-2.5 py-1.5 backdrop-blur-sm md:rounded-xl md:px-3 md:py-2">{movie.year}</span> : null}
          {movie.country ? <span className="min-w-0 truncate rounded-lg border border-white/35 bg-black/25 px-2.5 py-1.5 backdrop-blur-sm md:max-w-full md:rounded-xl md:px-3 md:py-2">{movie.country}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export default function HeroBanner({ movies }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % movies.length), 6500);
    return () => window.clearInterval(timer);
  }, [movies.length]);

  if (!movies.length) return null;

  const next = (current + 1) % movies.length;
  const previousSlide = () => setCurrent((value) => (value - 1 + movies.length) % movies.length);
  const nextSlide = () => setCurrent((value) => (value + 1) % movies.length);
  const currentMovie = failed[movies[current].id] ? { ...movies[current], backdropUrl: undefined } : movies[current];
  const nextMovie = failed[movies[next].id] ? { ...movies[next], backdropUrl: undefined } : movies[next];

  return (
    <section className="relative mx-auto max-w-[1400px] px-3 pb-1 pt-3 sm:px-4 md:px-8 md:pb-5 md:pt-6" aria-label="Tanlangan kontent">
      <div className="md:hidden">
        <HeroCard movie={currentMovie} priority={current === 0} onImageError={() => setFailed((value) => ({ ...value, [currentMovie.id]: true }))} />
      </div>
      <div className="hidden gap-3 md:grid md:grid-cols-2">
        <HeroCard movie={currentMovie} priority={current === 0} onImageError={() => setFailed((value) => ({ ...value, [currentMovie.id]: true }))} />
        {movies.length > 1 ? <HeroCard movie={nextMovie} priority={next === 0} onImageError={() => setFailed((value) => ({ ...value, [nextMovie.id]: true }))} /> : null}
      </div>

      {movies.length > 1 ? (
        <>
          <button type="button" onClick={previousSlide} aria-label="Oldingi banner" className="absolute left-5 top-[46%] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white backdrop-blur transition-colors hover:bg-black md:-left-1 md:top-1/2 md:h-14 md:w-14"><ChevronLeft className="h-5 w-5 md:h-6 md:w-6" /></button>
          <button type="button" onClick={nextSlide} aria-label="Keyingi banner" className="absolute right-5 top-[46%] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white backdrop-blur transition-colors hover:bg-black md:-right-1 md:top-1/2 md:h-14 md:w-14"><ChevronRight className="h-5 w-5 md:h-6 md:w-6" /></button>
          <div className="mt-2.5 flex justify-center gap-2 md:hidden">
            {movies.slice(0, 5).map((movie, index) => <button key={movie.id} type="button" onClick={() => setCurrent(index)} aria-label={`${index + 1}-banner`} aria-current={index === current ? "true" : undefined} className={`h-2 w-2 rounded-full transition-colors ${index === current ? "bg-fuchsia-400" : "bg-white/20"}`} />)}
          </div>
        </>
      ) : null}
    </section>
  );
}
