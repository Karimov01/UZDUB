import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { getTelegramNotificationAdmins, getTelegramNotificationRecipient, setTelegramNotificationRecipient } from "@/lib/movies-store";

export async function GET() {
  const access = await getAdminAccess();
  if (!access.isAdmin) return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const [recipient, admins] = await Promise.all([getTelegramNotificationRecipient(), getTelegramNotificationAdmins()]);
  return NextResponse.json({ recipient, admins, canManage: access.canManageTelegramNotifications }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const access = await getAdminAccess();
  if (!access.canManageTelegramNotifications) return NextResponse.json({ error: "Telegram xabar adminini faqat eng yuqori administrator o‘zgartira oladi." }, { status: 403 });
  const body = await request.json().catch(() => null) as { userId?: string } | null;
  if (!body?.userId) return NextResponse.json({ error: "Admin tanlanmadi." }, { status: 400 });
  const recipient = await setTelegramNotificationRecipient(body.userId);
  return recipient ? NextResponse.json({ recipient }) : NextResponse.json({ error: "Faqat faol va Telegram'i ulangan admin tanlanishi mumkin." }, { status: 400 });
}
