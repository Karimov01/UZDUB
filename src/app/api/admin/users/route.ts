import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readUsers } from "@/lib/movies-store";
export async function GET() { const session = await auth(); const allowed = session?.user?.id === "admin" || session?.user?.email === process.env.ADMIN_EMAIL; if (!allowed) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 }); return NextResponse.json({ users: await readUsers() }); }
