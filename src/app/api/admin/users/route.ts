import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfile, readUsers } from "@/lib/movies-store";
export async function GET() { const session = await auth(); const profile = session?.user?.id ? await getUserProfile(session.user.id) : undefined; const allowed = session?.user?.id === "admin" || session?.user?.email === process.env.ADMIN_EMAIL || profile?.role === "ADMIN"; if (!allowed) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 }); return NextResponse.json({ users: await readUsers() }); }
