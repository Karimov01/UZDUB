import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import { parseCatalogSort } from "@/lib/catalog";

type Props = { params: Promise<{ page: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = Number((await params).page);
  return { title: `Yangi seriallar — ${page}-sahifa`, alternates: { canonical: page === 1 ? "/serial" : `/serial/sahifa/${page}` } };
}

export default async function SerialCatalogPage({ params, searchParams }: Props) {
  const [{ page }, { sort }] = await Promise.all([params, searchParams]);
  return <CatalogPage kind="serial" page={Number(page)} sort={parseCatalogSort(sort)} />;
}
