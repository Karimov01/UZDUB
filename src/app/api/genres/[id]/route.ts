import { NextResponse } from "next/server";
import { deleteGenre, saveGenre } from "@/lib/movies-store";
import { slugify } from "@/lib/movie-input";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) { const { id } = await params; const body = await request.json(); const name = String(body.name ?? "").trim(); if (!name) return NextResponse.json({ error: "Janr nomi majburiy" }, { status: 400 }); const genre = { id, name, slug: slugify(String(body.slug || name)), color: String(body.color || "#7C3AED") }; await saveGenre(genre); return NextResponse.json({ genre }); }
export async function DELETE(_request: Request, { params }: Ctx) { const { id } = await params; return NextResponse.json({ ok: await deleteGenre(id) }); }
