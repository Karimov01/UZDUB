import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSerialBySlug } from "@/lib/movies";
import { buildEpisodeJsonLd, buildEpisodeMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import SerialTomashaClient from "@/components/player/SerialTomashaClient";

export const revalidate = 21600;

type PageProps = { params: Promise<{ slug: string; season: string; episode: string }> };

async function getEpisode(params: PageProps["params"]) {
  const { slug, season, episode } = await params;
  const serial = await getSerialBySlug(slug);
  const seasonNumber = Number(season);
  const episodeNumber = Number(episode);
  const currentEpisode = serial?.episodes?.find(
    (item) => item.season === seasonNumber && item.episode === episodeNumber
  );
  return { serial, currentEpisode };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serial, currentEpisode } = await getEpisode(params);
  if (!serial || !currentEpisode) return { title: "Qism topilmadi" };
  return buildEpisodeMetadata(serial, currentEpisode);
}

export default async function EpisodePage({ params }: PageProps) {
  const { serial, currentEpisode } = await getEpisode(params);
  if (!serial || !currentEpisode) notFound();

  return (
    <>
      <JsonLd data={buildEpisodeJsonLd(serial, currentEpisode)} />
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <SerialTomashaClient serial={serial} initialSeason={currentEpisode.season} initialEpisode={currentEpisode.episode} />
      </Suspense>
    </>
  );
}
