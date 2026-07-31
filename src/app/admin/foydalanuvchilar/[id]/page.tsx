import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bell, CalendarDays, Crown, Shield, UserRound } from "lucide-react";
import { getAdminAccess } from "@/lib/admin-access";
import { getUserProfile } from "@/lib/movies-store";

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  if (!access.isAdmin) redirect("/admin/login");
  const { id } = await params;
  const user = await getUserProfile(id);
  if (!user) notFound();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const isPremium = user.subscriptionType === "PREMIUM";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return <div className="max-w-4xl pb-10">
    <Link href="/admin/foydalanuvchilar" className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-100 mb-6"><ArrowLeft className="h-4 w-4" />Foydalanuvchilar ro‘yxatiga qaytish</Link>
    <section className="rounded-3xl p-6 md:p-8" style={{ background: "linear-gradient(135deg,rgba(39,21,69,.92),rgba(10,15,28,.96))", border: "1px solid rgba(168,85,247,.35)", boxShadow: "0 16px 55px rgba(0,0,0,.25)" }}>
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center"><div className="h-24 w-24 rounded-full p-0.5 shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 0 26px rgba(168,85,247,.35)" }}><div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center bg-violet-950 text-3xl font-bold text-white">{user.telegramPhotoUrl ? <img src={user.telegramPhotoUrl} alt={name} className="h-full w-full object-cover" /> : user.firstName.slice(0, 1)}</div></div><div><h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{user.telegramUsername ? `@${user.telegramUsername}` : "Telegram username ko‘rsatilmagan"}</p><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Telegram ID: {user.telegramId}</p><div className="flex flex-wrap gap-2 mt-4"><span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ color: isPremium ? "#f5d0fe" : "#ddd6fe", background: isPremium ? "rgba(236,72,153,.16)" : "rgba(124,58,237,.14)" }}>{isPremium ? <Crown className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}{isPremium ? "Premium" : "Oddiy"}</span>{isAdmin && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-200" style={{ background: "rgba(124,58,237,.16)" }}><Shield className="h-4 w-4" />{user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</span>}<span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${user.isActive ? "text-emerald-300" : "text-rose-300"}`} style={{ background: user.isActive ? "rgba(34,197,94,.13)" : "rgba(244,63,94,.13)" }}>● {user.isActive ? "Faol" : "Bloklangan"}</span></div></div></div>
    </section>
    <section className="grid sm:grid-cols-3 gap-4 mt-4"><div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><CalendarDays className="h-5 w-5 text-violet-400" /><p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>A’zo bo‘lgan sana</p><p className="mt-1 text-white font-semibold">{new Date(user.createdAt).toLocaleDateString("uz-UZ")}</p></div><div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><Bell className="h-5 w-5 text-violet-400" /><p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Telegram bildirishnomasi</p><p className={`mt-1 font-semibold ${user.receiveTelegramAdminNotifications ? "text-emerald-300" : "text-gray-300"}`}>{user.receiveTelegramAdminNotifications ? "Xabar oluvchi" : "O‘chiq"}</p></div><div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><UserRound className="h-5 w-5 text-violet-400" /><p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Oxirgi faollik</p><p className="mt-1 text-white font-semibold">{new Date(user.lastLoginAt).toLocaleString("uz-UZ")}</p></div></section>
  </div>;
}
