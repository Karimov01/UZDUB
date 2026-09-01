"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, CalendarDays, ChevronRight, Clock3, Eye, Film, Play, Star, Tag } from "lucide-react";
import { formatDuration, formatViewCount } from "@/lib/utils";
import { useSavedList } from "@/hooks/useSavedList";
import ExpandableText from "@/components/ui/ExpandableText";
import DetailAdSlot from "@/components/ads/DetailAdSlot";
import ContentStatusBanner from "@/components/movie/ContentStatusBanner";
import type { Movie } from "@/types/movie";

const COUNTRY_CODES: Record<string, string> = {
  "aqsh": "us", "amerika": "us", "amerika qo'shma shtatlari": "us", "usa": "us", "united states": "us",
  "turkiya": "tr", "turkey": "tr", "turkiye": "tr", "janubiy koreya": "kr", "koreya": "kr", "south korea": "kr",
  "shimoliy koreya": "kp", "north korea": "kp", "buyuk britaniya": "gb", "birlashgan qirollik": "gb", "angliya": "gb", "uk": "gb", "united kingdom": "gb",
  "hindiston": "in", "india": "in", "xitoy": "cn", "china": "cn", "yaponiya": "jp", "japan": "jp",
  "rossiya": "ru", "russia": "ru", "fransiya": "fr", "france": "fr", "germaniya": "de", "germany": "de",
  "italiya": "it", "italy": "it", "ispaniya": "es", "spain": "es", "kanada": "ca", "canada": "ca",
  "avstraliya": "au", "australia": "au", "meksika": "mx", "mexico": "mx", "braziliya": "br", "brazil": "br",
  "argentina": "ar", "o'zbekiston": "uz", "uzbekiston": "uz", "uzbekistan": "uz", "qozog'iston": "kz", "qozog‘iston": "kz", "qozogâiston": "kz", "qozogiston": "kz", "kazakhstan": "kz",
  "qirg'iziston": "kg", "qirgiziston": "kg", "kyrgyzstan": "kg", "tojikiston": "tj", "tajikistan": "tj",
  "eron": "ir", "iran": "ir", "isroil": "il", "israel": "il", "ukraina": "ua", "ukraine": "ua", "belarus": "by",
  "polsha": "pl", "poland": "pl", "shvetsiya": "se", "sweden": "se", "norvegiya": "no", "norway": "no",
  "daniya": "dk", "denmark": "dk", "finlyandiya": "fi", "finlandiya": "fi", "finland": "fi", "niderlandiya": "nl", "netherlands": "nl",
  "belgiya": "be", "belgium": "be", "shveytsariya": "ch", "switzerland": "ch", "avstriya": "at", "austria": "at",
  "irlandiya": "ie", "ireland": "ie", "yangi zelandiya": "nz", "new zealand": "nz", "tayland": "th", "tailand": "th", "thailand": "th",
  "indoneziya": "id", "indonesia": "id", "malayziya": "my", "malaziya": "my", "malaysia": "my", "filippin": "ph", "filipinlar": "ph", "philippines": "ph",
  "vietnam": "vn", "vetnam": "vn", "pokiston": "pk", "pakistan": "pk", "bangladesh": "bd",
  "birlashgan arab amirliklari": "ae", "bae": "ae", "united arab emirates": "ae", "misr": "eg", "egypt": "eg",
  "janubiy afrika": "za", "south africa": "za",
  "bolgariya": "bg", "chexiya": "cz", "ekvador": "ec", "falastin": "ps", "gonkong": "hk", "gretsiya": "gr",
  "gruziya": "ge", "kolumbiya": "co", "lyuksemburg": "lu", "ruminiya": "ro", "sent-kits va nevis": "kn",
  "serbiya": "rs", "singapur": "sg", "tayvan": "tw", "vengriya": "hu", "xorvatiya": "hr",
};

function countryCode(country?: string) {
  const primary = country?.split(/[,/·;]/)[0]?.trim().toLocaleLowerCase("uz") ?? "";
  return COUNTRY_CODES[primary];
}

function firstSentence(description: string) {
  const text = description.trim();
  const stop = text.indexOf(".");
  return stop < 0 ? text : `${text.slice(0, stop).trim()}...`;
}

function SimilarMovieCard({ movie }: { movie: Movie }) {
  return <Link href={`/kino/${movie.slug}`} style={{ width: "calc((100% - 0.75rem) / 2)" }} className="group block shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-[#0d0f18] transition-colors hover:border-violet-400/50 lg:w-full!">
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#151725]">
      {movie.posterUrl ? <Image src={movie.posterUrl} alt={movie.title} fill className="object-contain transition-transform duration-300 group-hover:scale-[1.02]" sizes="(max-width: 1023px) 48vw, 220px" /> : <div className="flex h-full items-center justify-center"><Film className="h-10 w-10 text-gray-600" /></div>}
      {movie.imdbRating ? <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-1 text-xs font-bold text-white backdrop-blur-sm"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{movie.imdbRating.toFixed(1)}</span> : null}
    </div>
    <div className="px-3 py-3">
      <h3 className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-violet-300">{movie.title}</h3>
      <p className="mt-1 text-xs text-gray-500">{movie.year ?? "—"}</p>
    </div>
  </Link>;
}

export default function KinoDetail({ movie, similarMovies = [] }: { movie: Movie; similarMovies?: Movie[] }) {
  const similar = similarMovies.slice(0, 6);
  const later = useSavedList("watchLater");
  const isLater = later.has(movie.id);
  // Detail kartasida faqat birinchi janr ko‘rinadi; to‘liq massiv qidiruv, tavsiya va SEO uchun saqlanadi.
  const visibleGenre = movie.genres?.[0]?.name;
  const flagCode = countryCode(movie.country);
  const plotPreview = firstSentence(movie.description);

  return <div className="min-h-screen bg-[#090a10]">
    <section className="relative overflow-hidden">
      {movie.backdropUrl ? <div className="absolute inset-0"><Image src={movie.backdropUrl} alt="" fill priority className="object-cover object-center opacity-35" sizes="100vw" /></div> : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#090a10_0%,rgba(9,10,16,.78)_52%,rgba(9,10,16,.48)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#090a10_0%,transparent_52%,rgba(9,10,16,.28)_100%)]" />

      <div className="relative mx-auto grid max-w-[1400px] gap-7 px-4 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 lg:grid-cols-[315px_1fr] lg:gap-11">
        <div className="mx-auto w-full max-w-[250px] lg:mx-0 lg:max-w-[315px]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/15 bg-[#151725] shadow-2xl">
            {movie.posterUrl ? <Image src={movie.posterUrl} alt={movie.title} fill priority className="object-contain" sizes="(max-width: 1024px) 250px, 315px" /> : <div className="flex h-full items-center justify-center"><Film className="h-14 w-14 text-gray-600" /></div>}
            <span className="absolute right-3 top-3 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white backdrop-blur">HD</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center justify-center text-center lg:items-start lg:py-5 lg:text-left">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-display)" }}>{movie.title}{movie.year ? <span className="text-gray-400"> ({movie.year})</span> : null}</h1>

          {movie.imdbRating ? <div className="mt-4 flex items-center justify-center gap-2 lg:justify-start"><span className="rounded-md bg-[#f5c518] px-2 py-1 text-sm font-black leading-none text-black">IMDb</span><span className="text-lg font-semibold text-white">{movie.imdbRating.toFixed(1)}</span></div> : null}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href={`/kino/${movie.slug}/tomosha`} className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-7 text-base font-semibold text-white shadow-lg shadow-violet-950/30 transition-transform hover:scale-[1.01]"><Play className="h-5 w-5 fill-white" />Tomosha qilish</Link>
            {later.isAuthenticated ? <button type="button" onClick={() => later.toggle(movie.id)} className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/20 px-6 text-base font-medium text-white transition-colors hover:border-violet-400/60 hover:bg-white/5"><Bookmark className={isLater ? "h-5 w-5 fill-current text-violet-300" : "h-5 w-5"} />{isLater ? "Ro‘yxatda" : "Keyin ko‘raman"}</button> : null}
          </div>

          <p className="mt-6 max-w-4xl text-center text-sm leading-6 text-gray-300 sm:text-base sm:leading-7 lg:text-left">{plotPreview}</p>

          <div className="mt-7 grid w-full grid-cols-2 gap-x-4 gap-y-5 border-t border-white/10 pt-6 text-left sm:grid-cols-4 lg:flex lg:flex-wrap lg:gap-0">
            {[
              { icon: CalendarDays, label: "Yil", value: movie.year?.toString() },
              { icon: Clock3, label: "Davomiyligi", value: movie.duration ? formatDuration(movie.duration) : null },
              { icon: null, label: "Mamlakat", value: movie.country },
              { icon: Tag, label: "Janr", value: visibleGenre },
              { icon: Eye, label: "Ko'rildi", value: `${formatViewCount(movie.viewCount ?? 0)} marta` },
            ].filter((item) => item.value).map(({ icon: Icon, label, value }) => <div key={label} className="flex min-w-0 items-center gap-3 lg:w-auto lg:flex-none lg:border-r lg:border-white/10 lg:px-6 first:lg:pl-0 last:lg:border-r-0 last:lg:pr-0">
              {label === "Mamlakat" && flagCode ? <Image src={`https://flagcdn.com/w80/${flagCode}.png`} alt={`${value} bayrog‘i`} width={36} height={24} className="h-6 w-9 shrink-0 rounded-sm object-cover shadow-sm" /> : Icon ? <Icon className="h-7 w-7 shrink-0 text-gray-400" /> : null}
              <div className="min-w-0"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 truncate text-sm font-medium text-white">{value}</p></div>
            </div>)}
          </div>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
      <DetailAdSlot />
      <ContentStatusBanner content={movie} />

      <section className="rounded-2xl border border-white/10 bg-white/[.025] px-5 py-6 shadow-[0_14px_50px_rgba(64,25,110,.12)] md:px-8">
        <h2 className="text-xl font-semibold text-white">Film haqida</h2>
        <ExpandableText text={movie.description} lines={2} alwaysShowToggle className="mt-3 text-sm leading-7 text-gray-400 md:text-base" buttonClassName="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-violet-400/50 hover:bg-white/5" />
      </section>

      {similar.length > 0 ? <section className="pt-8">
        <div className="mb-4 flex items-center gap-2"><h2 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>O&apos;xshash kinolar</h2><ChevronRight className="h-5 w-5 text-gray-400" /></div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible">
          {similar.map((item) => <SimilarMovieCard key={item.id} movie={item} />)}
        </div>
      </section> : null}
    </div>
  </div>;
}
