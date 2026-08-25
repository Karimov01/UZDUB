import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({ title, href, icon }: { title: string; href?: string; icon: React.ReactNode }) {
  return <div className="mx-auto mb-4 flex max-w-[1400px] items-center justify-between px-4 md:px-8">
    <h2 className="flex items-center gap-2 text-lg font-bold text-white md:text-xl" style={{ fontFamily: "var(--font-display)" }}>{icon}{title}</h2>
    {href ? <Link href={href} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[.035] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-white/25 hover:text-white">Barchasi<ChevronRight className="h-3.5 w-3.5" /></Link> : null}
  </div>;
}
