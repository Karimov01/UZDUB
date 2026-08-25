import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import { parseCatalogSort } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Yangi seriallar o‘zbek tilida",
  description: "Yangi seriallarni o‘zbek tilida bepul onlayn tomosha qiling.",
  alternates: { canonical: "/serial" },
};

export default async function SerialsPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  return <CatalogPage kind="serial" page={1} sort={parseCatalogSort(sort)} />;
}
