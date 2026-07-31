"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { Suspense } from "react";

export default function CompleteTelegramPage() {
  return <Suspense fallback={<CompletionCard state="loading" message="Telegram tasdiqlanmoqda..." />}><Complete /></Suspense>;
}

function Complete() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Telegram tasdiqlanmoqda...");

  useEffect(() => {
    const token = params.get("token") ?? params.get("code");
    if (!token) { setState("error"); setMessage("Tasdiqlash havolasi to‘liq emas."); return; }
    signIn("telegram", { code: token, redirect: false }).then((result) => {
      if (result?.error) { setState("error"); setMessage("Ushbu havola eskirgan, yaroqsiz yoki avval ishlatilgan."); return; }
      window.location.replace("/profilim");
    }).catch(() => { setState("error"); setMessage("Kirishni yakunlab bo‘lmadi. Yangi havola oling."); });
  }, [params]);
  return <CompletionCard state={state} message={message} />;
}

function CompletionCard({ state, message }: { state: "loading" | "error"; message: string }) {
  const Icon = state === "loading" ? LoaderCircle : ShieldAlert;
  return <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}><section className="w-full max-w-md rounded-3xl p-7 text-center" style={{ background: "linear-gradient(145deg,rgba(32,20,57,.96),rgba(11,13,24,.96))", border: "1px solid rgba(168,85,247,.4)", boxShadow: "0 24px 70px rgba(0,0,0,.42)" }}><div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: state === "loading" ? "rgba(124,58,237,.2)" : "rgba(244,63,94,.13)" }}><Icon className={`h-7 w-7 ${state === "loading" ? "animate-spin text-violet-300" : "text-rose-300"}`} /></div><h1 className="mt-5 text-xl font-bold text-white">{state === "loading" ? "UZDUB Play’ga kirish" : "Havola yaroqsiz"}</h1><p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{message}</p>{state === "error" && <Link href="/kirish" className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>Yangi havola olish</Link>}<div className="mt-5 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Xavfsiz Telegram tasdiqlashi</div></section></main>;
}
