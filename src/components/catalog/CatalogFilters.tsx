import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CatalogSort } from "@/lib/catalog";

const filters: { value: CatalogSort; label: string }[] = [
  { value: "new", label: "Yangi" },
  { value: "rating", label: "Reyting" },
  { value: "random", label: "Random" },
];

export default function CatalogFilters({ active, basePath }: { active: CatalogSort; basePath: string }) {
  return <div className="flex flex-wrap items-center gap-2" aria-label="Saralash turi">
    {filters.map((filter) => <Link key={filter.value} href={`${basePath}?sort=${filter.value}`} className={cn("rounded-lg border px-4 py-2 text-xs font-medium transition-colors sm:text-sm", active === filter.value ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[.025] text-gray-400 hover:border-white/20 hover:text-white")} aria-current={active === filter.value ? "page" : undefined}>{filter.label}</Link>)}
  </div>;
}
