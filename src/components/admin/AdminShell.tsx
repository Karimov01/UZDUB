"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Login sahifasida sidebar ko'rsatilmaydi (to'liq ekran); qolgan admin sahifalarda sidebar + margin.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <div className="flex-1 min-w-0 ml-64">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
