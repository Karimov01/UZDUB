import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import { parseCatalogSort } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tarjima kinolar o‘zbek tilida",
  description: "Yangi tarjima kinolarni o‘zbek tilida bepul onlayn tomosha qiling.",
  alternates: { canonical: "/kino" },
};

export default async function MoviesPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  return <CatalogPage kind="movie" page={1} sort={parseCatalogSort(sort)} />;
}
