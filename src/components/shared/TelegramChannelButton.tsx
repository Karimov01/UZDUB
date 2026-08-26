"use client";

import { ChevronRight, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_TELEGRAM_CHANNEL_URL } from "@/lib/telegram-channel";

export default function TelegramChannelButton() {
  const [href, setHref] = useState(DEFAULT_TELEGRAM_CHANNEL_URL);

  useEffect(() => {
    fetch("/api/public/site-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { telegramChannelUrl?: string }) => {
        if (typeof data.telegramChannelUrl === "string") setHref(data.telegramChannelUrl);
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex min-h-16 w-full items-center justify-between overflow-hidden rounded-2xl px-4 text-white transition duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transform-none motion-reduce:transition-none sm:min-h-[72px] sm:px-5"
      style={{ background: "linear-gradient(115deg, #229ED9, #32B8F2 52%, #1d8dcc)", border: "1px solid rgba(186,232,255,.78)", boxShadow: "0 0 20px rgba(50,184,242,.34), inset 0 1px 0 rgba(255,255,255,.32)" }}
    >
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/70" />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/45 bg-white/20 shadow-[0_0_18px_rgba(255,255,255,.24)] sm:h-12 sm:w-12">
        <Send className="h-5 w-5 fill-white text-white sm:h-6 sm:w-6" />
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-bold tracking-tight sm:text-lg lg:static lg:ml-3 lg:flex-1 lg:translate-x-0 lg:text-left">Telegramga qo&apos;shiling</span>
      <ChevronRight className="relative h-6 w-6 shrink-0 text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
    </a>
  );
}
