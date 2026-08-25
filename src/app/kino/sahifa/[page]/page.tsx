import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import { parseCatalogSort } from "@/lib/catalog";

type Props = { params: Promise<{ page: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = Number((await params).page);
  return { title: `Tarjima kinolar — ${page}-sahifa`, alternates: { canonical: page === 1 ? "/kino" : `/kino/sahifa/${page}` } };
}

export default async function MovieCatalogPage({ params, searchParams }: Props) {
  const [{ page }, { sort }] = await Promise.all([params, searchParams]);
  return <CatalogPage kind="movie" page={Number(page)} sort={parseCatalogSort(sort)} />;
}
