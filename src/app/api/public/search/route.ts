import { NextResponse } from "next/server";
import { getPublishedMovies } from "@/lib/movies";
import { parseSearchParams, searchMovies } from "@/lib/content-search";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const input = parseSearchParams(new URL(request.url).searchParams);
  const result = searchMovies(await getPublishedMovies(), input);
  return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
