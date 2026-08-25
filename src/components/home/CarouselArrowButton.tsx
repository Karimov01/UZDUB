import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CarouselArrowButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  const label = direction === "left" ? "Oldingi kartalar" : "Keyingi kartalar";
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#151719]/95 text-gray-200 shadow-[0_6px_20px_rgba(0,0,0,.45)] backdrop-blur-sm transition-all hover:border-white/35 hover:bg-[#202326] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95"><span className="sr-only">{label}</span>{direction === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</button>;
}
