import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { getAdminComments, moderateComments } from "@/lib/engagement-store";

export async function GET(request: Request) {
  if (!(await getAdminAccess()).isAdmin) return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const url = new URL(request.url); const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  return NextResponse.json(await getAdminComments(url.searchParams.get("q") ?? "", url.searchParams.get("status") ?? "ALL", page), { headers: { "cache-control": "private, no-store" } });
}
export async function PATCH(request: Request) {
  if (!(await getAdminAccess()).isAdmin) return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const body = await request.json().catch(() => null) as { ids?: string[]; status?: string } | null;
  if (!body?.ids?.length || !["PENDING", "APPROVED", "SPAM", "DELETED"].includes(body.status ?? "")) return NextResponse.json({ error: "Noto‘g‘ri ma’lumot" }, { status: 400 });
  await moderateComments(body.ids.slice(0, 100), body.status as "PENDING" | "APPROVED" | "SPAM" | "DELETED");
  return NextResponse.json({ ok: true });
}
