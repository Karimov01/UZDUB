import { Info } from "lucide-react";
import type { Movie } from "@/types/movie";

export default function ContentStatusBanner({ content }: { content: Movie }) {
  const messages = [
    content.isRussian ? "Rus tilida TS (Tez kunda o'zbek tilida)" : null,
    content.isComingSoon && content.isTrailer ? "Treyler" : null,
  ].filter((message): message is string => Boolean(message));

  if (messages.length === 0) return null;

  return (
    <div className="mb-4 space-y-2" aria-label="Kontent holati">
      {messages.map((message) => (
        <div key={message} className="flex min-h-11 items-center gap-3 rounded-xl border border-amber-500/55 bg-amber-950/45 px-4 py-3 text-sm font-semibold text-amber-300">
          <Info className="h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
          <span>{message}</span>
        </div>
      ))}
    </div>
  );
}
