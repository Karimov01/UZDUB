import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogSort } from "@/lib/catalog";

function visiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page > 0 && page <= total));
  const result: (number | "ellipsis")[] = [];
  [...pages].sort((a, b) => a - b).forEach((page, index, sorted) => {
    if (index && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

export default function Pagination({ currentPage, totalPages, basePath, sort }: { currentPage: number; totalPages: number; basePath: string; sort: CatalogSort }) {
  if (totalPages <= 1) return null;
  const href = (page: number) => `${basePath}/sahifa/${page}?sort=${sort}`;
  const control = "flex h-10 min-w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[.025] px-3 text-sm text-gray-300 transition-colors hover:border-white/25 hover:text-white";
  return <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Katalog sahifalari">
    {currentPage > 1 ? <Link href={href(currentPage - 1)} className={control} aria-label="Oldingi sahifa"><ChevronLeft className="h-4 w-4" /></Link> : null}
    {visiblePages(currentPage, totalPages).map((page, index) => page === "ellipsis" ? <span key={`e-${index}`} className="px-1 text-gray-500">…</span> : <Link key={page} href={href(page)} className={cn(control, page === currentPage && "border-emerald-400 bg-emerald-400 text-black hover:text-black")} aria-current={page === currentPage ? "page" : undefined}>{page}</Link>)}
    {currentPage < totalPages ? <Link href={href(currentPage + 1)} className={control} aria-label="Keyingi sahifa"><ChevronRight className="h-4 w-4" /></Link> : null}
  </nav>;
}
