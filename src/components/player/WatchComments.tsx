"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { Movie } from "@/types/movie";

type Comment = { id: string; text: string; createdAt: string; likesCount: number; author: { displayName: string; role: string } };
type Data = { reaction: Omit<WatchReaction, "canVote">; comments: Comment[]; totalComments: number; canComment: boolean; canVote: boolean; isAuthenticated: boolean };
export type WatchReaction = { likes: number; dislikes: number; myReaction: "LIKE" | "DISLIKE" | ""; canVote: boolean };

const WatchComments = forwardRef<HTMLElement, { movie: Movie; onReaction: (value: WatchReaction) => void }>(function WatchComments({ movie, onReaction }, ref) {
  const [data, setData] = useState<Data | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/public/engagement/${movie.id}?sort=latest&offset=0`, { cache: "no-store" });
    if (response.ok) { const value = await response.json() as Data; setData(value); onReaction({ ...value.reaction, canVote: value.canVote }); }
  }, [movie.id, onReaction]);
  useEffect(() => { void load(); }, [load]);
  const vote = async (reaction: "LIKE" | "DISLIKE") => {
    const response = await fetch(`/api/public/engagement/${movie.id}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reaction }) });
    const value = await response.json().catch(() => ({}));
    if (response.ok) { setError(""); void load(); } else setError(value.error || "Ovoz saqlanmadi.");
  };
  const send = async () => {
    if (!text.trim()) return;
    if (!data?.isAuthenticated && name.trim().length < 2) return setError("Ismingizni kiriting.");
    const response = await fetch(`/api/public/engagement/${movie.id}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, name, website: "" }) });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) return setError(value.error || "Izoh yuborilmadi.");
    setText(""); setError(""); void load();
  };
  const visibleComments = showAll ? (data?.comments ?? []) : (data?.comments ?? []).slice(0, 3);
  return <section ref={ref} id="izohlar" className="mt-[2px] scroll-mt-24 border-t border-white/[.08] py-7">
    <div className="sr-only"><button id="watch-like" onClick={() => void vote("LIKE")}>Yoqdi</button><button id="watch-dislike" onClick={() => void vote("DISLIKE")}>Yoqmadi</button></div>
    <h2 className="text-xl font-bold">Izohlar <span className="ml-1 text-sm font-normal text-slate-500">{data?.totalComments ?? 0}</span></h2>
    <div className="mt-5 flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-950 text-rose-400">?</div>
      <div className="min-w-0 flex-1">
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} maxLength={800} placeholder="Izoh qoldiring..." className="w-full resize-y border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-white outline-none placeholder:text-slate-600" />
        {!data?.isAuthenticated && <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Ismingiz" className="mt-2 h-10 w-full max-w-[280px] rounded-lg border border-white/[.06] bg-white/[.06] px-3 text-sm outline-none" />}
        <div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Hurmatli munosabat — eng go&apos;zal til.</p><button onClick={() => void send()} className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-400">Yuborish</button></div>
      </div>
    </div>
    {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    <div className="mt-7 space-y-5">{visibleComments.length ? visibleComments.map((comment) => <article key={comment.id} className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold">{comment.author.displayName?.[0] || "?"}</div>
      <div><div className="flex items-center gap-2 text-sm"><b>{comment.author.displayName}</b>{comment.author.role === "GUEST" && <span className="rounded bg-white/[.08] px-1.5 py-0.5 text-[10px] text-slate-400">MEHMON</span>}<span className="text-xs text-slate-600">hozir</span></div><p className="mt-1 text-sm text-slate-300">{comment.text}</p><div className="mt-2 flex gap-5 text-xs text-slate-500"><span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{comment.likesCount}</span><span className="flex items-center gap-1"><ThumbsDown className="h-3.5 w-3.5" />0</span></div></div>
    </article>) : <p className="py-5 text-sm text-slate-500">Hozircha izohlar yo&apos;q. Birinchi bo&apos;lib o&apos;z fikringizni qoldiring.</p>}</div>
    {(data?.totalComments ?? 0) > 3 && <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-6 w-full rounded-xl border border-white/10 bg-white/[.04] py-3 text-sm font-semibold text-fuchsia-300 hover:bg-white/[.07]">{showAll ? "Yashirish" : `Barchasi (${data?.totalComments ?? 0})`}</button>}
  </section>;
});
export default WatchComments;
