"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, ChevronLeft, ChevronRight, Crown, Pencil, Search, Shield, UserRound, Users, X } from "lucide-react";
import type { StoredUser, UserStats } from "@/lib/movies-store";

type UsersData = { users: StoredUser[]; total: number; page: number; size: number; stats: UserStats };
type NotificationData = { recipient?: StoredUser; admins: StoredUser[]; canManage: boolean };

const emptyUsers: UsersData = { users: [], total: 0, page: 1, size: 20, stats: { total: 0, free: 0, premium: 0, admins: 0 } };
const emptyNotifications: NotificationData = { admins: [], canManage: false };

const fullName = (user: StoredUser) => [user.firstName, user.lastName].filter(Boolean).join(" ");
const roleTitle = (role: string) => role === "SUPER_ADMIN" ? "Super admin" : role === "ADMIN" ? "Admin" : "Foydalanuvchi";
const ago = (date: string) => {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  return minutes < 2 ? "Hozir" : minutes < 60 ? `${minutes} daqiqa oldin` : minutes < 1440 ? `${Math.floor(minutes / 60)} soat oldin` : new Date(date).toLocaleDateString("uz-UZ");
};

function Avatar({ user, size = "h-10 w-10" }: { user: StoredUser; size?: string }) {
  return <div className={`${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-bold`} style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
    {user.telegramPhotoUrl ? <img src={user.telegramPhotoUrl} alt="" className="h-full w-full object-cover" /> : user.firstName.slice(0, 1).toUpperCase()}
  </div>;
}

export default function UsersPage() {
  const [data, setData] = useState<UsersData>(emptyUsers);
  const [notifications, setNotifications] = useState<NotificationData>(emptyNotifications);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<StoredUser | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCandidate, setNotificationCandidate] = useState("");
  const [saving, setSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(query), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), size: "20", q });
    if (filter === "PREMIUM" || filter === "FREE") params.set("subscription", filter);
    if (filter === "ADMIN" || filter === "USER") params.set("role", filter);
    if (filter === "ACTIVE" || filter === "BLOCKED") params.set("status", filter);
    const [usersResponse, notificationsResponse] = await Promise.all([
      fetch(`/api/admin/users?${params}`, { cache: "no-store" }),
      fetch("/api/admin/telegram-notifications", { cache: "no-store" }),
    ]);
    const usersJson = await usersResponse.json();
    const notificationsJson = await notificationsResponse.json();
    if (usersResponse.ok) { setData(usersJson); setSelected([]); }
    if (notificationsResponse.ok) setNotifications(notificationsJson);
  }, [page, q, filter]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const pages = Math.max(1, Math.ceil(data.total / data.size));
  const selectedUsers = useMemo(() => data.users.filter((user) => selected.includes(user.id)), [data.users, selected]);
  const stats = [
    { title: "Jami foydalanuvchilar", value: data.stats.total, icon: Users, color: "#a855f7" },
    { title: "Oddiy foydalanuvchilar", value: data.stats.free, icon: UserRound, color: "#3b82f6" },
    { title: "Premium foydalanuvchilar", value: data.stats.premium, icon: Crown, color: "#f59e0b" },
    { title: "Admin foydalanuvchilar", value: data.stats.admins, icon: Shield, color: "#d946ef" },
  ];

  const openNotifications = () => {
    setError("");
    setNotificationCandidate(notifications.recipient?.id ?? "");
    setShowNotificationModal(true);
  };

  const saveNotificationRecipient = async () => {
    if (!notificationCandidate) return setError("Xabar oluvchi adminni tanlang.");
    setNotificationSaving(true); setError("");
    const response = await fetch("/api/admin/telegram-notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: notificationCandidate }) });
    const json = await response.json();
    setNotificationSaving(false);
    if (!response.ok) return setError(json.error ?? "Saqlab bo‘lmadi.");
    setNotifications((current) => ({ ...current, recipient: json.recipient, admins: current.admins.map((admin) => ({ ...admin, receiveTelegramAdminNotifications: admin.id === json.recipient.id })) }));
    setShowNotificationModal(false);
  };

  const saveUser = async () => {
    if (!drawer) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/admin/users/${drawer.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: drawer.role, subscriptionType: drawer.subscriptionType, isActive: drawer.isActive }) });
    const json = await response.json();
    setSaving(false);
    if (!response.ok) return setError(json.error ?? "Saqlab bo‘lmadi.");
    setDrawer(null); void load();
  };

  return <div className="pb-28">
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">Foydalanuvchilar</h1>
      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Telegram orqali ro‘yxatdan o‘tgan haqiqiy foydalanuvchilar</p>
    </div>

    <section className="rounded-2xl p-4 md:p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between" style={{ background: "linear-gradient(115deg,rgba(36,21,64,.82),rgba(13,21,35,.88))", border: "1px solid rgba(168,85,247,.38)", boxShadow: "0 0 30px rgba(124,58,237,.1)" }}>
      <div className="flex gap-3 items-center">
        <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-violet-100" style={{ background: "radial-gradient(circle at 35% 30%,#c084fc,#6d28d9 65%,#312e81)", boxShadow: "0 0 20px rgba(168,85,247,.45)" }}><Bell className="h-5 w-5" /></div>
        <div>
          <h2 className="font-semibold text-white">Telegram bildirishnomalari</h2>
          {notifications.recipient ? <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Xabar oluvchi: <span className="text-white">{fullName(notifications.recipient)}</span> <span className="ml-2 text-emerald-400">● Faol</span></p> : <p className="text-sm mt-1 text-amber-300">Xabar oluvchi hali tanlanmagan.</p>}
        </div>
      </div>
      <button onClick={openNotifications} disabled={!notifications.canManage} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 8px 20px rgba(124,58,237,.25)" }}>{notifications.canManage ? "O‘zgartirish" : "Faqat super admin"}</button>
    </section>

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{stats.map((item) => <div key={item.title} className="p-5 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(145deg,rgba(19,18,32,.96),rgba(10,11,20,.96))", border: `1px solid ${item.color}70`, boxShadow: `0 0 24px ${item.color}16` }}><item.icon className="h-6 w-6" style={{ color: item.color }} /><p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>{item.title}</p><p className="text-3xl text-white font-bold mt-1">{item.value.toLocaleString("uz-UZ")}</p></div>)}</div>

    <section className="rounded-2xl overflow-hidden" style={{ background: "rgba(16,16,27,.82)", border: "1px solid var(--border)" }}>
      <div className="p-4 flex flex-col lg:flex-row gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-3 text-violet-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Foydalanuvchini qidirish..." className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-black/20 text-sm text-white outline-none" style={{ border: "1px solid var(--border)" }} /></div>
        <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="rounded-xl px-3 text-sm text-white bg-black/20" style={{ border: "1px solid var(--border)" }}><option value="ALL">Barchasi</option><option value="FREE">Oddiy</option><option value="PREMIUM">Premium</option><option value="USER">User</option><option value="ADMIN">Admin</option><option value="ACTIVE">Faol</option><option value="BLOCKED">Bloklangan</option></select>
        <button onClick={openNotifications} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-violet-100" style={{ border: "1px solid rgba(168,85,247,.48)", background: "rgba(124,58,237,.12)" }}><Bell className="h-4 w-4" />Telegram xabar admini</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px]"><thead><tr style={{ background: "rgba(255,255,255,.025)" }}><th className="p-4"><input aria-label="Barchasini tanlash" type="checkbox" checked={data.users.length > 0 && selected.length === data.users.length} onChange={() => setSelected(selected.length === data.users.length ? [] : data.users.map((user) => user.id))} /></th>{["Foydalanuvchi", "Telegram ID", "Maqom", "Role", "A’zo bo‘lgan", "Oxirgi faollik", "Holat", "Amallar"].map((title) => <th key={title} className="p-4 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{title}</th>)}</tr></thead><tbody>{data.users.map((user) => <tr key={user.id} className="transition-colors hover:bg-violet-500/[.04]" style={{ borderTop: "1px solid var(--border)", background: selected.includes(user.id) ? "rgba(124,58,237,.09)" : undefined }}><td className="p-4"><input aria-label={`${user.firstName}ni tanlash`} type="checkbox" checked={selected.includes(user.id)} onChange={() => setSelected((ids) => ids.includes(user.id) ? ids.filter((id) => id !== user.id) : [...ids, user.id])} /></td><td className="p-4"><div className="flex items-center gap-3"><Avatar user={user} size="h-9 w-9" /><div><p className="text-sm text-white">{fullName(user)}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.telegramUsername ? `@${user.telegramUsername}` : "Username yo‘q"}</p></div></div></td><td className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>{user.telegramId}</td><td className="p-4"><span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ background: user.subscriptionType === "PREMIUM" ? "rgba(217,70,239,.15)" : "rgba(255,255,255,.06)", color: user.subscriptionType === "PREMIUM" ? "#f0abfc" : "#cbd5e1" }}>{user.subscriptionType === "PREMIUM" && <Crown className="h-3 w-3" />}{user.subscriptionType === "PREMIUM" ? "Premium" : "Oddiy"}</span></td><td className="p-4"><span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ background: user.role !== "USER" ? "rgba(124,58,237,.18)" : "rgba(255,255,255,.06)", color: user.role !== "USER" ? "#c4b5fd" : "#cbd5e1" }}>{user.role !== "USER" && <Shield className="h-3 w-3" />}{roleTitle(user.role)}</span></td><td className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>{new Date(user.createdAt).toLocaleDateString("uz-UZ")}</td><td className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>{ago(user.lastLoginAt)}</td><td className="p-4"><span className="text-xs" style={{ color: user.isActive ? "#4ade80" : "#fb7185" }}>{user.isActive ? "Faol" : "Bloklangan"}</span></td><td className="p-4"><button onClick={() => { setError(""); setDrawer({ ...user }); }} aria-label="Tahrirlash" className="p-2 rounded-lg text-violet-300 hover:bg-violet-500/15"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody></table>{!data.users.length && <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>Foydalanuvchi topilmadi.</div>}</div>
      <div className="p-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}><span className="text-xs" style={{ color: "var(--text-muted)" }}>{data.total} ta foydalanuvchi</span><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span className="text-sm text-white">{page} / {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>
    </section>

    {selected.length > 0 && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl" style={{ background: "rgba(20,15,34,.94)", backdropFilter: "blur(18px)", border: "1px solid rgba(168,85,247,.55)" }}><span className="text-sm text-white">{selected.length} foydalanuvchi tanlandi</span><button onClick={() => setDrawer({ ...selectedUsers[0] })} className="px-3 py-2 rounded-xl text-sm text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>Tahrirlash</button><button onClick={() => setSelected([])} className="text-sm text-violet-300">Bekor qilish</button></div>}

    {showNotificationModal && <div className="fixed inset-0 z-[70] p-4 flex items-end sm:items-center justify-center" style={{ background: "rgba(2,4,12,.74)", backdropFilter: "blur(8px)" }}><section className="w-full max-w-3xl rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg,rgba(22,20,37,.99),rgba(9,12,23,.99))", border: "1px solid rgba(168,85,247,.45)", boxShadow: "0 24px 80px rgba(0,0,0,.5)" }}><div className="p-5 md:p-6 flex items-start justify-between" style={{ borderBottom: "1px solid var(--border)" }}><div className="flex gap-3"><div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 0 24px rgba(168,85,247,.38)" }}><Bell className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-white">Telegram bildirishnomalari</h2><p className="text-sm mt-1 max-w-xl" style={{ color: "var(--text-muted)" }}>Yangi foydalanuvchilar va muhim tizim hodisalari haqida Telegram xabarlarini qabul qiladigan adminni tanlang.</p></div></div><button onClick={() => setShowNotificationModal(false)} className="p-2 text-gray-400 hover:text-white"><X /></button></div><div className="p-5 md:p-6 grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">{notifications.admins.map((admin) => { const connected = Boolean(admin.telegramId); const active = notificationCandidate === admin.id; return <button key={admin.id} disabled={!connected || !notifications.canManage} onClick={() => setNotificationCandidate(admin.id)} className="text-left rounded-2xl p-4 transition-all disabled:opacity-55 disabled:cursor-not-allowed" style={{ border: `1px solid ${active ? "#a855f7" : "rgba(255,255,255,.1)"}`, background: active ? "linear-gradient(135deg,rgba(124,58,237,.22),rgba(236,72,153,.08))" : "rgba(255,255,255,.025)", boxShadow: active ? "0 0 24px rgba(168,85,247,.18)" : undefined }}><div className="flex items-center gap-3"><Avatar user={admin} /><div className="min-w-0 flex-1"><p className="font-semibold text-white truncate">{fullName(admin)}</p><p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{admin.telegramUsername ? `@${admin.telegramUsername}` : "Telegram username yo‘q"}</p></div>{active && <Check className="h-5 w-5 text-violet-300" />}</div><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-md px-2 py-1 text-xs text-violet-200" style={{ background: "rgba(124,58,237,.16)" }}>{roleTitle(admin.role)}</span>{connected ? <span className="text-xs text-emerald-400">● Telegram: Ulangan</span> : <span className="text-xs text-amber-300">⚠ Telegram ulanmagan</span>}</div><p className="mt-4 text-sm font-medium" style={{ color: active ? "#e9d5ff" : "var(--text-muted)" }}>{active ? "● Xabar oluvchi" : "○ Tanlash"}</p></button>; })}{!notifications.admins.length && <p className="col-span-full py-9 text-center text-sm" style={{ color: "var(--text-muted)" }}>Hozircha admin topilmadi.</p>}</div>{error && <p className="px-6 text-sm text-rose-400">{error}</p>}<div className="p-5 md:px-6 flex justify-end gap-3" style={{ borderTop: "1px solid var(--border)" }}><button onClick={() => setShowNotificationModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-white" style={{ border: "1px solid var(--border)" }}>Bekor qilish</button><button disabled={notificationSaving || !notifications.canManage} onClick={saveNotificationRecipient} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>{notificationSaving ? "Saqlanmoqda..." : "Tanlash va saqlash"}</button></div></section></div>}

    {drawer && <aside className="fixed right-0 top-0 h-screen w-full max-w-md z-[60] p-6 overflow-y-auto" style={{ background: "rgba(15,14,25,.98)", borderLeft: "1px solid rgba(168,85,247,.35)", boxShadow: "-20px 0 60px rgba(0,0,0,.38)" }}><button onClick={() => setDrawer(null)} className="absolute right-5 top-5 text-gray-400"><X /></button><div className="flex items-center gap-3 mb-7"><Avatar user={drawer} size="h-14 w-14" /><div><h2 className="font-bold text-white">{fullName(drawer)}</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>{drawer.telegramUsername ? `@${drawer.telegramUsername}` : "Username yo‘q"}</p><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Telegram ID: {drawer.telegramId}</p></div></div><label className="block text-sm mb-2" style={{ color: "var(--text-muted)" }}>Role</label><select value={drawer.role} disabled={drawer.role === "SUPER_ADMIN"} onChange={(event) => setDrawer({ ...drawer, role: event.target.value })} className="w-full p-3 rounded-xl bg-black/20 text-white mb-5 disabled:opacity-60" style={{ border: "1px solid var(--border)" }}><option value="USER">User</option><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super admin</option></select><label className="block text-sm mb-2" style={{ color: "var(--text-muted)" }}>Premium maqomi</label><select value={drawer.subscriptionType} onChange={(event) => setDrawer({ ...drawer, subscriptionType: event.target.value as StoredUser["subscriptionType"] })} className="w-full p-3 rounded-xl bg-black/20 text-white mb-5" style={{ border: "1px solid var(--border)" }}><option value="FREE">Oddiy</option><option value="PREMIUM">Premium</option></select><label className="block text-sm mb-2" style={{ color: "var(--text-muted)" }}>Hisob holati</label><select value={drawer.isActive ? "ACTIVE" : "BLOCKED"} onChange={(event) => setDrawer({ ...drawer, isActive: event.target.value === "ACTIVE" })} className="w-full p-3 rounded-xl bg-black/20 text-white mb-7" style={{ border: "1px solid var(--border)" }}><option value="ACTIVE">Faol</option><option value="BLOCKED">Bloklangan</option></select>{error && <p className="mb-4 text-sm text-rose-400">{error}</p>}<div className="flex gap-3"><button onClick={() => setDrawer(null)} className="flex-1 py-3 rounded-xl text-white" style={{ border: "1px solid var(--border)" }}>Bekor qilish</button><button disabled={saving || drawer.role === "SUPER_ADMIN"} onClick={saveUser} className="flex-1 py-3 rounded-xl text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button></div></aside>}
  </div>;
}
