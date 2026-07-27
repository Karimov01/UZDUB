"use client";

import { useState } from "react";
import { Save, Globe, Bell, Shield, Palette } from "lucide-react";

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <div
      className="w-10 h-6 rounded-full relative cursor-pointer transition-all shrink-0"
      style={{ background: active ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "var(--bg-primary)", border: "1px solid var(--border)" }}
      onClick={onToggle}
    >
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: active ? "calc(100% - 22px)" : "2px" }} />
    </div>
  );
}

export default function SozlamalarPage() {
  const [settings, setSettings] = useState({
    siteName: "UZDUB Play", siteDesc: "O'zbekistonning eng premium kino va serial platformasi",
    maintenanceMode: false, registrationOpen: true, emailNotifications: true,
    pushNotifications: false, defaultLanguage: "uz", contentPerPage: "24",
    maxUploadSize: "500", watermarkEnabled: true,
  });
  const [saved, setSaved] = useState(false);

  const set = (key: string, value: unknown) => setSettings((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none";
  const inputStyle = { background: "var(--bg-primary)", border: "1px solid var(--border)" };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Sozlamalar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Platforma konfiguratsiyasi</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: saved ? "#10B981" : "linear-gradient(135deg, #7C3AED, #EC4899)" }}
        >
          <Save className="h-4 w-4" />
          {saved ? "Saqlandi!" : "Saqlash"}
        </button>
      </div>

      <div className="space-y-5">
        {/* General */}
        <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Umumiy sozlamalar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Sayt nomi</label>
              <input className={inputClass} style={inputStyle} value={settings.siteName} onChange={(e) => set("siteName", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Standart til</label>
              <select className={inputClass} style={inputStyle} value={settings.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value)}>
                <option value="uz">O&apos;zbek</option>
                <option value="ru">Rus</option>
                <option value="en">Ingliz</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Sayt tavsifi</label>
            <textarea className={inputClass} style={{ ...inputStyle, resize: "none", minHeight: 80 }} value={settings.siteDesc} onChange={(e) => set("siteDesc", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Sahifadagi kontentlar soni</label>
              <select className={inputClass} style={inputStyle} value={settings.contentPerPage} onChange={(e) => set("contentPerPage", e.target.value)}>
                {["12", "24", "36", "48"].map((v) => <option key={v} value={v}>{v} ta</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Maks. yuklash hajmi (MB)</label>
              <input className={inputClass} style={inputStyle} type="number" value={settings.maxUploadSize} onChange={(e) => set("maxUploadSize", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Bildirishnomalar</h3>
          </div>
          {[
            { key: "emailNotifications" as const, label: "Email bildirishnomalar", desc: "Yangi kontent va yangilanishlar haqida email yuborish" },
            { key: "pushNotifications" as const, label: "Push bildirishnomalar", desc: "Brauzer orqali real-vaqt bildirishnomalari" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
              <Toggle active={settings[key]} onToggle={() => set(key, !settings[key])} />
            </div>
          ))}
        </div>

        {/* Security */}
        <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Xavfsizlik va kirish</h3>
          </div>
          {[
            { key: "registrationOpen" as const, label: "Ro'yxatdan o'tishga ruxsat", desc: "Yangi foydalanuvchilar ro'yxatdan o'ta oladi" },
            { key: "maintenanceMode" as const, label: "Ta'mirlash rejimi", desc: "Saytni vaqtincha o'chirib qo'yish" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
              <Toggle active={settings[key]} onToggle={() => set(key, !settings[key])} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Kontent sozlamalari</h3>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-white">Vodiy belgisi (watermark)</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Videolarda UZDUB Play logotipini ko&apos;rsatish</p>
            </div>
            <Toggle active={settings.watermarkEnabled} onToggle={() => set("watermarkEnabled", !settings.watermarkEnabled)} />
          </div>
        </div>
      </div>
    </div>
  );
}
