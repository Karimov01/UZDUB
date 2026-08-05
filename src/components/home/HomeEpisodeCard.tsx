import Image from "next/image";
import Link from "next/link";
import { Clock3, Eye, Play, Tv2 } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import { formatDuration, formatViewCount } from "@/lib/utils";
import type { LatestEpisode } from "@/lib/movies";

export default function HomeEpisodeCard({ item }: { item: LatestEpisode }) {
  const { serial, episode } = item;
  const href = `/serial/${serial.slug}/qism/${episode.season}/${episode.episode}`;

  return (
    <Link href={href} className="group block shrink-0 w-[150px] sm:w-[168px]" style={{ scrollSnapAlign: "start" }}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl" style={{ background: "var(--bg-tertiary)", border: "1px solid rgba(167,139,250,0.22)" }}>
        {serial.posterUrl ? <Image src={optimizedTmdbImage(serial.posterUrl, "poster")!} alt={`${serial.title} ${episode.episode}-qism`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 150px, 168px" /> : <div className="absolute inset-0 flex items-center justify-center"><Tv2 className="h-9 w-9 text-violet-300/60" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, rgba(124,58,237,.96), rgba(219,39,119,.92))", boxShadow: "0 5px 18px rgba(139,92,246,.36)" }}><Play className="h-3 w-3 fill-white" />{episode.episode}-qism</span>
        <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-semibold text-white">{episode.title || `${episode.episode}-qism`}</span>
      </div>
      <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-violet-300">{serial.title}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{episode.season}-fasl</span>
        {episode.duration ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatDuration(episode.duration)}</span> : null}
        {episode.viewCount > 0 ? <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatViewCount(episode.viewCount)}</span> : null}
      </div>
    </Link>
  );
}
