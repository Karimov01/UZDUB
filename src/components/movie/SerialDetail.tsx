"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Bookmark, CalendarDays, ChevronDown, Eye, Film, Layers3, Play, Tag } from "lucide-react";
import { useState } from "react";
import { useSavedList } from "@/hooks/useSavedList";
import { formatViewCount } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import SeasonEpisodeSelector, { normalizeEpisodes } from "@/components/serial/SeasonEpisodeSelector";
import SeriesCard from "@/components/home/SeriesCard";

const COUNTRY_CODES: Record<string, string> = {
  "janubiy koreya": "kr", koreya: "kr", "south korea": "kr", turkiya: "tr", turkey: "tr",
  aqsh: "us", amerika: "us", "amerika qo'shma shtatlari": "us", usa: "us",
  "buyuk britaniya": "gb", angliya: "gb", uk: "gb", hindiston: "in", xitoy: "cn",
  yaponiya: "jp", rossiya: "ru", fransiya: "fr", germaniya: "de", ispaniya: "es",
  kanada: "ca", "o'zbekiston": "uz", uzbekiston: "uz", qozogiston: "kz",
};

function countryCode(country?: string) {
  return COUNTRY_CODES[country?.split(/[,/·;]/)[0]?.trim().toLocaleLowerCase("uz") ?? ""];
}

export default function SerialDetail({ serial, similarMovies = [] }: { serial: Movie; similarMovies?: Movie[] }) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const episodes = normalizeEpisodes(serial.episodes ?? []);
  const firstEpisode = episodes[0];
  const later = useSavedList("watchLater");
  const isLater = later.has(serial.id);
  const seasons = new Set(episodes.map((episode) => episode.season)).size || 1;
  const flag = countryCode(serial.country);
  const watchHref = firstEpisode ? `/serial/${serial.slug}/qism/${firstEpisode.season}/${firstEpisode.episode}` : `/serial/${serial.slug}/tomosha`;
  const similar = similarMovies.slice(0, 8);


  return <div className="min-h-screen bg-[#080a10] text-white">
    <section className="relative overflow-hidden border-b border-white/[.05]">
      {serial.backdropUrl ? <Image src={serial.backdropUrl} alt="" fill priority className="object-cover object-center opacity-20" sizes="100vw" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a10_0%,rgba(8,10,16,.9)_50%,rgba(8,10,16,.68)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#080a10_0%,transparent_60%,rgba(8,10,16,.5)_100%)]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-7 px-4 pb-9 pt-7 md:px-8 md:py-10 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-center lg:gap-11">
        <div className="mx-auto w-full max-w-[230px] lg:mx-0 lg:max-w-[270px]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/15 bg-[#131620] shadow-2xl">
            {serial.posterUrl ? <Image src={serial.posterUrl} alt={serial.title} fill priority className="object-contain" sizes="(max-width:1024px) 230px,270px" /> : <div className="flex h-full items-center justify-center"><Film className="h-14 w-14 text-white/25" /></div>}
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
          <span className="rounded-md bg-fuchsia-600/80 px-2 py-1 text-xs font-semibold">Serial</span>
          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{serial.title}{serial.year ? <span className="text-gray-400"> ({serial.year})</span> : null}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {serial.imdbRating ? <><span className="rounded bg-[#f5c518] px-1.5 py-1 text-xs font-black text-black">IMDb</span><b>{serial.imdbRating.toFixed(1)}</b></> : null}
            {serial.internalRating ? <><span className="rounded bg-blue-500 px-1.5 py-1 text-xs font-black">MDL</span><b>{serial.internalRating.toFixed(1)}</b></> : null}
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-gray-300 md:text-base md:leading-7">{serial.shortDesc || serial.description}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href={watchHref} className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-7 font-semibold shadow-lg shadow-fuchsia-950/30"><Play className="h-5 w-5 fill-white" />Tomosha qilish</Link>
            {later.isAuthenticated ? <button type="button" onClick={() => later.toggle(serial.id)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-5 font-medium hover:border-fuchsia-400/50"><Bookmark className={isLater ? "h-5 w-5 fill-fuchsia-400 text-fuchsia-400" : "h-5 w-5"} />{isLater ? "Saqlangan" : "Keyin ko‘raman"}</button> : null}
          </div>
          <div className="no-scrollbar mt-7 flex w-full snap-x gap-2 overflow-x-auto pb-2 text-left lg:gap-0 lg:overflow-visible">
            {[
              { icon: CalendarDays, label: "Yil", value: serial.year?.toString() },
              { icon: Layers3, label: "Fasl · epizod", value: `${seasons} · ${episodes.length}` },
              { icon: null, label: "Mamlakat", value: serial.country },
              { icon: Tag, label: "Janrlar", value: serial.genres?.map((genre) => genre.name).join(", ") },
              { icon: Eye, label: "Ko‘rildi", value: `${formatViewCount(serial.viewCount ?? 0)} marta` },
            ].filter((item) => item.value).map(({ icon: Icon, label, value }) => <div key={label} className="flex min-w-[155px] shrink-0 snap-start items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 lg:min-w-0 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:bg-transparent lg:px-6 first:lg:pl-0 last:lg:border-r-0">
              {label === "Mamlakat" && flag ? <Image src={`https://flagcdn.com/w80/${flag}.png`} alt={`${value} bayrog‘i`} width={36} height={24} className="h-6 w-9 rounded-sm object-cover" /> : Icon ? <Icon className="h-7 w-7 shrink-0 text-gray-400" /> : null}
              <div className="min-w-0"><p className="text-[11px] text-gray-500">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>
            </div>)}
          </div>
        </div>
      </div>
    </section>

<div id="yandex_rtb_R-A-19814476-1" />
    <Script id="yandex-rtb-R-A-19814476-1" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `window.yaContextCb = window.yaContextCb || []; window.yaContextCb.push(() => { Ya.Context.AdvManager.render({ blockId: "R-A-19814476-1", renderTo: "yandex_rtb_R-A-19814476-1" }); });` }} />
  
    {firstEpisode ? <section className="mx-auto max-w-[1400px] px-4 pt-8 md:px-8">
      <div className="mb-4 rounded-2xl border border-white/[.08] bg-white/[.025] p-4 md:p-5">
        <button type="button" onClick={() => setDescriptionOpen((value) => !value)} className="flex w-full items-center justify-between text-left" aria-expanded={descriptionOpen}><h2 className="font-bold">Tavsif</h2><ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${descriptionOpen ? "rotate-180" : ""}`} /></button>
        {descriptionOpen ? <p className="mt-3 text-sm leading-6 text-gray-400 md:text-base">{serial.description}</p> : null}
      </div>
      <Link href={watchHref} className="group relative block aspect-video overflow-hidden rounded-2xl border border-white/15 bg-black">{(firstEpisode.previewUrl || serial.backdropUrl) ? <Image src={firstEpisode.previewUrl || serial.backdropUrl!} alt="1-qism" fill className="object-cover" sizes="100vw" /> : null}<span className="absolute inset-0 bg-black/20" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-pink-500 shadow-xl transition-transform group-hover:scale-105"><Play className="ml-1 h-7 w-7 fill-white" /></span></span></Link>
    </section> : null}

    {episodes.length ? <SeasonEpisodeSelector slug={serial.slug} episodes={episodes} title={serial.title} /> : null}

    {similar.length ? <section className="mx-auto max-w-[1400px] px-4 pb-12 md:px-8"><h2 className="mb-4 text-xl font-bold">O‘xshash seriallar</h2><div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">{similar.map((item) => <SeriesCard key={item.id} serial={item} />)}</div></section> : null}
  </div>;
}
