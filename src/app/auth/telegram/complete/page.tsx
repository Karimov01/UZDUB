"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
export default function CompleteTelegramPage() { return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Telegram tasdiqlanmoqda...</div>}><Complete /></Suspense>; }
function Complete() { const params = useSearchParams(); const [message, setMessage] = useState("Telegram tasdiqlanmoqda..."); useEffect(() => { const code = params.get("code"); if (!code) { setMessage("Tasdiqlash kodi topilmadi."); return; } signIn("telegram", { code, redirect: false }).then((result) => { if (result?.error) setMessage("Havola yaroqsiz yoki avval ishlatilgan."); else window.location.href = "/"; }); }, [params]); return <div className="min-h-screen flex items-center justify-center text-white">{message}</div>; }
