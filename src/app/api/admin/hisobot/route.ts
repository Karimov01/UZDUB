import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { getReport } from "@/lib/analytics-store";
export async function GET(request:Request){if(!(await getAdminAccess()).isAdmin)return NextResponse.json({error:"Ruxsat yo‘q"},{status:403});const days=Math.min(30,Math.max(1,Number(new URL(request.url).searchParams.get("days")??7)));return NextResponse.json(await getReport(days),{headers:{"cache-control":"private,no-store"}})}
