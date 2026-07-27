import type { Metadata } from "next";
import { Shield, Crown, UserCheck } from "lucide-react";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

const USERS = [
  { id: 1, name: "Abdulloh Karimov", username: "@abdulloh_k", role: "ADMIN", joined: "2024-01-15", views: 1240, status: "active" },
  { id: 2, name: "Zulfiya Rahimova", username: "@zulfiya_r", role: "PREMIUM", joined: "2024-02-20", views: 892, status: "active" },
  { id: 3, name: "Jasur Toshmatov", username: "@jasur_t", role: "USER", joined: "2024-03-10", views: 456, status: "active" },
  { id: 4, name: "Malika Yusupova", username: "@malika_y", role: "PREMIUM", joined: "2024-03-22", views: 734, status: "active" },
  { id: 5, name: "Bobur Mirzayev", username: "@bobur_m", role: "USER", joined: "2024-04-05", views: 123, status: "inactive" },
  { id: 6, name: "Dilnoza Hasanova", username: "@dilnoza_h", role: "USER", joined: "2024-04-18", views: 567, status: "active" },
  { id: 7, name: "Sarvar Nazarov", username: "@sarvar_n", role: "PREMIUM", joined: "2024-05-01", views: 980, status: "active" },
  { id: 8, name: "Gulnora Tursunova", username: "@gulnora_t", role: "USER", joined: "2024-05-14", views: 234, status: "active" },
  { id: 9, name: "Otabek Ruziyev", username: "@otabek_r", role: "USER", joined: "2024-06-02", views: 89, status: "inactive" },
  { id: 10, name: "Nozima Xolmatova", username: "@nozima_x", role: "PREMIUM", joined: "2024-06-15", views: 1102, status: "active" },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof Shield }> = {
  ADMIN: { label: "Admin", color: "#EC4899", bg: "rgba(236,72,153,0.15)", Icon: Shield },
  PREMIUM: { label: "Premium", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", Icon: Crown },
  USER: { label: "Foydalanuvchi", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", Icon: UserCheck },
};

export default function FoydalanuvchilarPage() {
  const active = USERS.filter((u) => u.status === "active").length;
  const premium = USERS.filter((u) => u.role === "PREMIUM").length;
  const admins = USERS.filter((u) => u.role === "ADMIN").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Foydalanuvchilar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{USERS.length} ta foydalanuvchi ro&apos;yxatga olgan</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Faol foydalanuvchilar", value: active, color: "#10B981" },
          { label: "Premium a&apos;zolar", value: premium, color: "#F59E0B" },
          { label: "Adminlar", value: admins, color: "#EC4899" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: s.color, fontFamily: "var(--font-display)" }}>{s.value}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }} dangerouslySetInnerHTML={{ __html: s.label }} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              {["#", "Foydalanuvchi", "Rol", "Qo'shilgan", "Ko'rishlar", "Holat", "Amallar"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USERS.map((user, i) => {
              const roleConf = ROLE_CONFIG[user.role];
              return (
                <tr key={user.id} className="hover:bg-white/3 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 w-fit"
                      style={{ background: roleConf.bg, color: roleConf.color }}>
                      <roleConf.Icon className="h-3 w-3" />
                      {roleConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{user.joined}</td>
                  <td className="px-4 py-3 text-sm text-white">{user.views.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{ background: user.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: user.status === "active" ? "#10B981" : "#EF4444" }}>
                      {user.status === "active" ? "Faol" : "Faolsiz"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded-lg text-xs transition-all hover:bg-white/8"
                        style={{ color: "var(--accent-violet)", border: "1px solid rgba(139,92,246,0.3)" }}>
                        Tahrirlash
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
