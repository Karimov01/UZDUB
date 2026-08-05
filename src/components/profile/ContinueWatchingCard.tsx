import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { optimizedTmdbImage } from "@/lib/images";
import type { Movie } from "@/types/movie";
import type { StoredWatchProgress } from "@/lib/movies-store";

export default function ContinueWatchingCard({ movie, progress }: { movie: Movie; progress: StoredWatchProgress }) {
  const episode = progress.episodeId ? movie.episodes?.find((item) => item.id === progress.episodeId) : undefined;
  const href = episode ? `/serial/${movie.slug}/qism/${episode.season}/${episode.episode}` : `/kino/${movie.slug}/tomosha`;
  const percent = progress.durationSeconds > 0 ? Math.max(2, Math.min(98, Math.round(progress.positionSeconds / progress.durationSeconds * 100))) : 0;
  return <Link href={href} className="group block w-40 shrink-0"><div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid rgba(167,139,250,.22)" }}>{movie.backdropUrl || movie.posterUrl ? <Image src={optimizedTmdbImage(movie.backdropUrl || movie.posterUrl, "backdrop")!} alt={movie.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="160px" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/90"><Play className="h-4 w-4 fill-white text-white" /></span></span><span className="absolute bottom-0 left-0 h-1 bg-violet-400" style={{ width: `${percent}%` }} /></div><h3 className="mt-2 line-clamp-1 text-sm font-semibold text-white">{movie.title}</h3><p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{episode ? `${episode.season}-fasl, ${episode.episode}-qism` : "Kino"} · {percent}% tomosha qilindi</p></Link>;
}
