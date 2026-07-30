import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readUsers } from "@/lib/movies-store";
export async function GET() { const session=await auth(); if(session?.user?.id!=="admin") return NextResponse.json({error:"Ruxsat yo‘q"},{status:403}); return NextResponse.json({users:await readUsers()}); }
