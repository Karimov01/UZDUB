"use client";

/* eslint-disable @next/next/no-img-element -- Izoh avatar URL'lari foydalanuvchi ma'lumoti; ularni server image proxy orqali o'tkazmaymiz. */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Globe2,
  LockKeyhole,
  MessageCircle,
  Send,
  Share2,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import type { Movie } from "@/types/movie";

type Comment = {
  id: string;
  text: string;
  parentComment?: string;
  createdAt: string;
  likesCount: number;
  likedByMe: boolean;
  author: { id: string; displayName: string; avatar?: string; role: string };
};
type Data = {
  rating: { average: number; count: number; myScore: number };
  reaction: {
    likes: number;
    dislikes: number;
    myReaction: "LIKE" | "DISLIKE" | "";
  };
  comments: Comment[];
  totalComments: number;
  totalTopLevel: number;
  canComment: boolean;
  canVote: boolean;
  isAuthenticated: boolean;
};
const card = {
  background: "linear-gradient(145deg,rgba(18,19,31,.92),rgba(10,11,20,.94))",
  border: "1px solid var(--border)",
  boxShadow: "0 12px 32px rgba(0,0,0,.17)",
};
const ago = (date: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return minutes < 2
    ? "Hozir"
    : minutes < 60
      ? `${minutes} daqiqa oldin`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} soat oldin`
        : new Date(date).toLocaleDateString("uz-UZ");
};
const nameOf = (c: Comment) => c.author.displayName || "Foydalanuvchi";

export default function EngagementPanel({ content }: { content: Movie }) {
  const [data, setData] = useState<Data | null>(null),
    [sort, setSort] = useState<"latest" | "top">("latest"),
    [expanded, setExpanded] = useState(false),
    [loadingAll, setLoadingAll] = useState(false),
    [text, setText] = useState(""),
    [guestName, setGuestName] = useState(""),
    [replyTo, setReplyTo] = useState<Comment | null>(null),
    [hover, setHover] = useState(0),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [isVoting, setIsVoting] = useState(false);
  const anchor = useRef<HTMLElement>(null);
  const getPage = useCallback(async (offset = 0) => {
    const r = await fetch(
      `/api/public/engagement/${content.id}?sort=${sort}&offset=${offset}`,
      { cache: "no-store" },
    );
    return r.ok ? ((await r.json()) as Data) : null;
  }, [content.id, sort]);
  const load = useCallback(async () => {
    const next = await getPage();
    if (next) setData(next);
  }, [getPage]);
  useEffect(() => {
    setExpanded(false);
    void load();
  }, [load, sort]);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const allComments = async () => {
    if (!data) return;
    setLoadingAll(true);
    let offset = data.comments.length;
    let merged = data.comments;
    while (offset < data.totalComments) {
      const next = await getPage(offset);
      if (!next?.comments.length) break;
      const ids = new Set(merged.map((c) => c.id));
      merged = [...merged, ...next.comments.filter((c) => !ids.has(c.id))];
      if (next.comments.length < 10) break;
      offset += next.comments.length;
    }
    setData({ ...data, comments: merged });
    setExpanded(true);
    setLoadingAll(false);
  };
  const vote = async (body: {
    score?: number;
    reaction?: "LIKE" | "DISLIKE";
  }) => {
    if (isVoting) return;
    if (!data?.canVote) return setError("Baho berish uchun avval tizimga kiring.");
    if (body.score && data.rating.myScore) return setError("Sizning bahoyingiz saqlangan va o'zgarmaydi.");
    if (body.reaction && data.reaction.myReaction) return setError("Sizning munosabatingiz saqlangan va o'zgarmaydi.");
    setIsVoting(true);
    setError("");
    try {
      const r = await fetch(`/api/public/engagement/${content.id}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) setError(json?.error ?? "Ovoz saqlanmadi.");
      else {
        notify(body.score ? "Bahoyingiz saqlandi" : "Munosabatingiz saqlandi");
        await load();
      }
    } finally {
      setIsVoting(false);
    }
  };
  const sendComment = async (reply = false, replyBody = "", replyName = "") => {
    const body = reply ? replyBody : text;
    const name = reply ? replyName : guestName;
    if (!data?.isAuthenticated && name.trim().length < 2) return setError("Izoh qoldirish uchun ismingizni kiriting.");
    setError("");
    const r = await fetch(`/api/public/engagement/${content.id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: body,
        name,
        parentId: reply ? replyTo?.id : undefined,
        website: "",
      }),
    });
    const json = await r.json();
    if (!r.ok) return setError(json.error ?? "Izoh yuborilmadi.");
    setText("");
    setReplyTo(null);
    notify(reply ? "Javob yuborildi" : "Izoh yuborildi");
    void load();
  };
  const like = async (id: string) => {
    const r = await fetch(`/api/public/engagement/comment-likes/${id}`, {
      method: "POST",
    });
    if (r.ok) void load();
    else setError("Izohni yoqtirish uchun kiring.");
  };
  const share = async (kind: "telegram" | "whatsapp" | "facebook" | "copy") => {
    const url = window.location.href;
    const title = `${content.title} — UZDUB Play`;
    if (kind === "copy") {
      await navigator.clipboard.writeText(url);
      return notify("Havola nusxalandi");
    }
    const target =
      kind === "telegram"
        ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        : kind === "whatsapp"
          ? `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`
          : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };
  const grouped = useMemo(() => {
    const roots: Comment[] = [];
    const replies = new Map<string, Comment[]>();
    for (const c of data?.comments ?? []) {
      if (c.parentComment)
        replies.set(c.parentComment, [...(replies.get(c.parentComment) ?? []), c]);
      else roots.push(c);
    }
    return { roots, replies };
  }, [data?.comments]);
  const roots = expanded ? grouped.roots : grouped.roots.slice(0, 3);
  const hasMore = (data?.totalTopLevel ?? 0) > 3;
  const ratingLocked = Boolean(data?.rating.myScore);
  const reactionLocked = Boolean(data?.reaction.myReaction);
  const score = ratingLocked ? (data?.rating.myScore ?? 0) : hover;
  const reactionTotal = (data?.reaction.likes ?? 0) + (data?.reaction.dislikes ?? 0);
  const positivePercent = reactionTotal ? Math.round(((data?.reaction.likes ?? 0) / reactionTotal) * 100) : 0;
  const Avatar = ({ comment }: { comment: Comment }) => (
    <div
      className="h-9 w-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-bold"
      style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
    >
      {comment.author.avatar ? (
        <img
          src={comment.author.avatar}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        nameOf(comment)[0]
      )}
    </div>
  );
  const ReplyInput = ({ target }: { target: Comment }) => {
    const [draft, setDraft] = useState("");
    const [name, setName] = useState(guestName);
    return (
      <div
        className="mt-3 ml-1 sm:ml-7 rounded-xl p-3"
        style={{
          background: "rgba(124,58,237,.08)",
          border: "1px solid rgba(168,85,247,.28)",
        }}
      >
        <div className="flex justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-violet-200">
              ↪ {nameOf(target)} uchun javob
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {target.text}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        {!data?.isAuthenticated && <input value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={40} placeholder="Ismingiz" className="mb-2 w-full rounded-lg px-2.5 py-2 text-sm text-white outline-none" style={{ background: "rgba(0,0,0,.24)", border: "1px solid var(--border)" }} />}
        <div className="flex gap-2">
          <textarea
            autoFocus
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            rows={2}
            maxLength={800}
            placeholder="Javobingizni yozing..."
            className="flex-1 min-w-0 rounded-lg p-2.5 text-sm text-white resize-none outline-none"
            style={{
              background: "rgba(0,0,0,.24)",
              border: "1px solid var(--border)",
              direction: "ltr",
              textAlign: "left",
              unicodeBidi: "normal",
            }}
          />
          <button
            onClick={() => void sendComment(true, draft, name)}
            disabled={draft.trim().length < 2 || (!data?.isAuthenticated && name.trim().length < 2)}
            className="self-end p-3 rounded-lg text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };
  const CommentCard = ({
    comment,
    parent,
  }: {
    comment: Comment;
    parent?: Comment;
  }) => (
    <article
      className={
        parent ? "ml-3 sm:ml-9 mt-3 rounded-xl p-3.5" : "rounded-xl p-3.5"
      }
      style={{
        background: parent ? "rgba(124,58,237,.055)" : "rgba(255,255,255,.025)",
        border: `1px solid ${parent ? "rgba(168,85,247,.18)" : "rgba(255,255,255,.06)"}`,
      }}
    >
      <div className="flex gap-3">
        <Avatar comment={comment} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-sm text-white">{nameOf(comment)}</b>
            {(comment.author.role === "ADMIN" || comment.author.role === "SUPER_ADMIN") && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded text-violet-100"
                style={{ background: "rgba(124,58,237,.36)" }}
              >
                ADMIN
              </span>
            )}
            {comment.author.role === "GUEST" && <span className="text-[10px] px-1.5 py-0.5 rounded text-violet-200" style={{ background: "rgba(124,58,237,.18)" }}>MEHMON</span>}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              • {ago(comment.createdAt)}
            </span>
          </div>
          {parent && (
            <div
              className="mt-2 border-l-2 pl-2 py-1 rounded"
              style={{
                borderColor: "#a855f7",
                background: "rgba(255,255,255,.025)",
              }}
            >
              <p className="text-xs text-violet-200">↪ {nameOf(parent)}</p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
              {parent.text}
              </p>
            </div>
          )}
          <p
            className="mt-1.5 text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {comment.text}
          </p>
          <div className="mt-3 flex gap-4">
            <button
              onClick={() => void like(comment.id)}
              className={`text-xs inline-flex gap-1 ${comment.likedByMe ? "text-yellow-300" : "text-gray-400"}`}
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${comment.likedByMe ? "fill-current" : ""}`}
              />
              {comment.likesCount}
            </button>
            {data?.canComment && !parent && (
              <button
                onClick={() => setReplyTo(comment)}
                className="text-xs text-violet-300"
              >
                Javob berish
              </button>
            )}
          </div>
          {!parent && replyTo?.id === comment.id && (
            <ReplyInput target={comment} />
          )}
        </div>
      </div>
    </article>
  );
  return (
    <section ref={anchor} className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="order-3 lg:order-1 rounded-2xl p-4 md:p-5" style={card}>
          <div className="flex justify-between gap-3 mb-4">
            <h2 className="flex gap-2 text-xl font-bold text-white">
              <MessageCircle className="h-5 w-5 text-violet-400" />
              Izohlar{" "}
              <span
                className="text-sm rounded-full px-2 py-0.5 text-violet-200"
                style={{ background: "rgba(124,58,237,.17)" }}
              >
                {data?.totalComments ?? 0}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSort("latest")}
                className="px-3 py-1.5 text-xs rounded-lg"
                style={
                  sort === "latest"
                    ? { background: "rgba(124,58,237,.3)", color: "white" }
                    : { color: "#94a3b8" }
                }
              >
                So‘nggi
              </button>
              <button
                onClick={() => setSort("top")}
                className="px-3 py-1.5 text-xs rounded-lg"
                style={
                  sort === "top"
                    ? { background: "rgba(124,58,237,.3)", color: "white" }
                    : { color: "#94a3b8" }
                }
              >
                Eng yaxshi
              </button>
            </div>
          </div>
          {data?.canComment ? (
            <div className="mb-5">
              {!data?.isAuthenticated && <input value={guestName} onChange={(event) => setGuestName(event.currentTarget.value)} maxLength={40} placeholder="Ismingiz" className="mb-2 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={{ background: "rgba(0,0,0,.22)", border: "1px solid var(--border)" }} />}
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="flex gap-2">
              <textarea
                dir="ltr"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                maxLength={800}
                placeholder="Izohingizni yozing..."
                className="flex-1 min-w-0 rounded-xl p-3 text-sm text-white resize-none outline-none"
                style={{
                  background: "rgba(0,0,0,.22)",
                  border: "1px solid var(--border)",
                  direction: "ltr",
                  textAlign: "left",
                  unicodeBidi: "normal",
                }}
              />
              <button
                onClick={() => void sendComment()}
                disabled={text.trim().length < 2 || (!data?.isAuthenticated && guestName.trim().length < 2)}
                className="self-end p-3 rounded-xl text-white disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#db2777)",
                }}
              >
                <Send className="h-4 w-4" />
              </button>
              </div>
            </div>
          ) : (
            <div
              className="mb-5 rounded-xl p-4 flex flex-col sm:flex-row gap-3 justify-between"
              style={{
                background: "rgba(124,58,237,.08)",
                border: "1px solid rgba(168,85,247,.26)",
              }}
            >
              <p className="text-sm text-white">
                Izoh yozish uchun avval ro‘yxatdan o‘ting.
              </p>
              <Link href="/kirish" className="text-sm text-violet-200">
                Kirish / Ro‘yxatdan o‘tish
              </Link>
            </div>
          )}
          <div className="space-y-3 transition-all duration-500">
            {roots.map((comment) => (
              <div key={comment.id}>
                <CommentCard comment={comment} />
                {(grouped.replies.get(comment.id) ?? []).map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    parent={comment}
                  />
                ))}
              </div>
            ))}
            {data && !data.comments.length && (
              <p
                className="py-8 text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Birinchi izohni siz qoldiring.
              </p>
            )}
          </div>
          {hasMore && !expanded && (
            <button
              onClick={() => void allComments()}
              disabled={loadingAll}
              className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-violet-100 transition hover:brightness-110 disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg,rgba(124,58,237,.34),rgba(219,39,119,.3))",
                border: "1px solid rgba(168,85,247,.45)",
              }}
            >
              {loadingAll
                ? "Izohlar yuklanmoqda..."
                : `Barcha izohlarni ko‘rish (${data?.totalComments ?? 0})`}{" "}
              <ChevronDown className="inline h-4 w-4" />
            </button>
          )}
          {hasMore && expanded && (
            <button
              onClick={() => {
                setExpanded(false);
                anchor.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="w-full mt-4 py-3 rounded-xl text-sm text-violet-200"
              style={{ border: "1px solid rgba(168,85,247,.35)" }}
            >
              <ChevronUp className="inline h-4 w-4" /> Yashirish
            </button>
          )}
        </div>
        <aside className="order-1 lg:order-2 space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="flex gap-2 text-lg font-bold text-white">
              <Share2 className="h-5 w-5 text-violet-400" />
              Ulashish
            </h2>
            <div className="grid grid-cols-4 gap-2 mt-5">
              {[
                { label: "Telegram", icon: Send, a: "telegram" },
                { label: "WhatsApp", icon: MessageCircle, a: "whatsapp" },
                { label: "Facebook", icon: Globe2, a: "facebook" },
                { label: "Nusxalash", icon: Copy, a: "copy" },
              ].map(({ label, icon: Icon, a }) => (
                <button
                  key={label}
                  onClick={() =>
                    void share(
                      a as "telegram" | "whatsapp" | "facebook" | "copy",
                    )
                  }
                  className="flex flex-col items-center gap-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white"
                    style={{
                      background: "rgba(124,58,237,.16)",
                      border: "1px solid rgba(168,85,247,.2)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-4 sm:p-5 overflow-hidden" style={{ background:"radial-gradient(circle at 86% 0%,rgba(192,38,211,.19),transparent 38%),linear-gradient(145deg,rgba(23,20,43,.96),rgba(10,12,24,.98))", border:"1px solid rgba(216,70,239,.62)", boxShadow:"0 0 18px rgba(192,38,211,.18),inset 0 1px rgba(255,255,255,.07)" }}>
            <h2 className="flex gap-2 text-lg font-bold text-white"><Star className="h-5 w-5 text-fuchsia-400" />UzdubPlay uchun reyting</h2>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="shrink-0 mx-auto sm:mx-0 h-28 w-28 rounded-full flex flex-col items-center justify-center" style={{ background:"radial-gradient(circle,rgba(112,31,182,.28),rgba(10,10,22,.8) 68%)", border:"2px solid #d86bff", boxShadow:"0 0 18px rgba(216,107,255,.45)" }}>
                <Star className="h-5 w-5 fill-fuchsia-400 text-fuchsia-400" />
                <strong className="mt-1 text-3xl leading-none text-white">{data?.rating.count ? data.rating.average.toFixed(1) : "—"}</strong>
                <span className="mt-1 text-xs font-medium text-fuchsia-300">{data?.rating.count ? "Ajoyib!" : "Baho kutilmoqda"}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} aria-label={`${n} ball`} disabled={ratingLocked || isVoting} onMouseEnter={() => { if (!ratingLocked) setHover(n); }} onMouseLeave={() => { if (!ratingLocked) setHover(0); }} onClick={() => void vote({ score:n })} className="min-w-0 flex flex-col items-center gap-1 disabled:cursor-not-allowed" style={{ color:score >= n ? "#facc15" : "#d8b4fe", opacity:ratingLocked && score < n ? .45 : 1 }}>
                      <Star className={`h-5 w-5 sm:h-6 sm:w-6 ${score >= n ? "fill-current" : ""}`} /><span className="text-[10px] text-slate-300">{n}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-300"><b className="text-white">{data?.rating.count ?? 0}</b> ta baho <span className="mx-1 text-fuchsia-400">•</span><b className="text-emerald-400">{positivePercent}% ijobiy</b></p>
                {ratingLocked ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300"><Check className="h-4 w-4" />Siz {data?.rating.myScore}/10 baho berdingiz <LockKeyhole className="ml-1 h-3.5 w-3.5" /></p> : <p className="mt-2 text-xs text-violet-200">Baho faqat bir marta beriladi.</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => void vote({ reaction:"LIKE" })} disabled={reactionLocked || isVoting} className="py-2.5 rounded-xl font-medium text-white disabled:cursor-not-allowed" style={{ border:"1px solid rgba(74,222,128,.6)", background:data?.reaction.myReaction === "LIKE" ? "rgba(22,163,74,.2)" : "rgba(10,35,25,.35)", boxShadow:data?.reaction.myReaction === "LIKE" ? "0 0 14px rgba(74,222,128,.2)" : "none" }}><ThumbsUp className={`inline h-4 w-4 mr-1.5 ${data?.reaction.myReaction === "LIKE" ? "fill-current" : ""}`} />{data?.reaction.myReaction === "LIKE" ? "Yoqdi ✓" : `Yoqdi (${data?.reaction.likes ?? 0})`}</button>
              <button onClick={() => void vote({ reaction:"DISLIKE" })} disabled={reactionLocked || isVoting} className="py-2.5 rounded-xl font-medium text-white disabled:cursor-not-allowed" style={{ border:"1px solid rgba(251,113,133,.62)", background:data?.reaction.myReaction === "DISLIKE" ? "rgba(190,24,93,.2)" : "rgba(45,12,23,.32)", boxShadow:data?.reaction.myReaction === "DISLIKE" ? "0 0 14px rgba(251,113,133,.18)" : "none" }}><ThumbsDown className={`inline h-4 w-4 mr-1.5 ${data?.reaction.myReaction === "DISLIKE" ? "fill-current" : ""}`} />{data?.reaction.myReaction === "DISLIKE" ? "Yoqmadi ✓" : `Yoqmadi (${data?.reaction.dislikes ?? 0})`}</button>
            </div>
            {reactionLocked && <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-violet-200"><LockKeyhole className="h-3.5 w-3.5" />Munosabatingiz saqlandi</p>}
          </div>
        </aside>
      </div>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-4 py-3 rounded-xl text-sm text-white"
          style={{
            background: "rgba(28,20,47,.96)",
            border: "1px solid rgba(168,85,247,.6)",
          }}
        >
          {toast}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </section>
  );
}
