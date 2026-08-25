import { notFound } from "next/navigation";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import Pagination from "@/components/catalog/Pagination";
import HomeMovieCard from "@/components/home/HomeMovieCard";
import SeriesCard from "@/components/home/SeriesCard";
import { getKinolar, getSerials } from "@/lib/movies";
import { paginateCatalog, sortCatalog, type CatalogSort } from "@/lib/catalog";

export default async function CatalogPage({ kind, page, sort }: { kind: "movie" | "serial"; page: number; sort: CatalogSort }) {
  const isMovie = kind === "movie";
  const basePath = isMovie ? "/kino" : "/serial";
  const pageSize = isMovie ? 20 : 12;
  const all = sortCatalog(isMovie ? await getKinolar() : await getSerials(), sort);
  const catalog = paginateCatalog(all, page, pageSize);
  if (!Number.isInteger(page) || page < 1 || page > catalog.totalPages) notFound();

  return <div className="min-h-screen bg-[#0d0f10] py-8 sm:py-12">
    <div className="mx-auto max-w-[1280px] px-4 md:px-8">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white md:text-3xl">{isMovie ? "Tarjima kinolar" : "Yangi seriallar"}</h1>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-gray-300">o‘zbek tilida</span>
          </div>
          <p className="mt-1 text-sm text-gray-400">{isMovie ? "Tarjima kinolarni bepul tomosha qiling!" : "Yangi seriallarni bepul tomosha qiling!"}</p>
        </div>
        <CatalogFilters active={sort} basePath={basePath} />
      </div>

      {catalog.items.length ? <div className={isMovie ? "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5" : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"}>
        {catalog.items.map((item) => isMovie ? <HomeMovieCard key={item.id} movie={item} layout="grid" /> : <SeriesCard key={item.id} serial={item} layout="grid" />)}
      </div> : <div className="rounded-2xl border border-white/10 bg-white/[.025] py-20 text-center text-gray-400">Hozircha kontent topilmadi.</div>}

      <Pagination currentPage={page} totalPages={catalog.totalPages} basePath={basePath} sort={sort} />
    </div>
  </div>;
}
