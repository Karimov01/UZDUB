import { NextResponse } from "next/server";
import { getPublishedMovies } from "@/lib/movies";

export const runtime = "nodejs";
export const revalidate = 600;

// Ochiq (auth'siz) — faqat nashr etilgan kinolar. Qidiruv (client) shu yerdan oladi.
export async function GET() {
  const movies = await getPublishedMovies();
  return NextResponse.json({ movies });
}
