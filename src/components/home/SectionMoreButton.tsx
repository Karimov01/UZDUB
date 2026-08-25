import Link from "next/link";
import { Eye } from "lucide-react";

export default function SectionMoreButton({ href }: { href: string }) {
  return <Link href={href} className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/15 bg-[#151719] px-3 text-xs font-medium text-gray-200 shadow-sm transition-colors hover:border-white/30 hover:bg-[#1b1e21] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 md:h-9 md:px-3.5 md:text-sm"><Eye className="h-3.5 w-3.5" />Barchasi</Link>;
}
