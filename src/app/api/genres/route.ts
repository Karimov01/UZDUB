import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readGenres, saveGenre } from "@/lib/movies-store";
import { slugify } from "@/lib/movie-input";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ genres: await readGenres() }); }
export async function POST(request: Request) { const body = await request.json(); const name = String(body.name ?? "").trim(); if (!name) return NextResponse.json({ error: "Janr nomi majburiy" }, { status: 400 }); const genre = { id: randomUUID(), name, slug: slugify(String(body.slug || name)), color: String(body.color || "#7C3AED") }; await saveGenre(genre); return NextResponse.json({ genre }); }
