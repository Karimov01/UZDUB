"use client";

import { useEffect, useState } from "react";
import { Activity, Eye, MonitorSmartphone, UserPlus, Users } from "lucide-react";

type ListItem = { views: number; [key: string]: string | number };
type ReportData = {
  kpi: { views: number; unique: number; registered: number; guests: number; online: number };
  paths: ListItem[];
  sources: ListItem[];
  devices: ListItem[];
  browsers: ListItem[];
  trend: { day: string; views: number; visitors: number }[];
};

const emptyReport: ReportData = {
  kpi: { views: 0, unique: 0, registered: 0, guests: 0, online: 0 },
  paths: [], sources: [], devices: [], browsers: [], trend: [],
};

function StatList({ title, items, itemKey }: { title: string; items: ListItem[]; itemKey: string }) {
  const max = Math.max(1, ...items.map((item) => item.views));
  return (
    <section className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
      <h2 className="font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-3">
        {items.length ? items.map((item, index) => (
          <div key={`${String(item[itemKey])}-${index}`}>
            <div className="flex justify-between gap-3 text-sm mb-1">
              <span className="truncate" style={{ color: "var(--text-secondary)" }}>{item[itemKey]}</span>
              <b className="text-violet-300">{item.views}</b>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.views / max) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#ec4899)" }} />
            </div>
          </div>
        )) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ma’lumotlar yig‘ilmoqda.</p>}
      </div>
    </section>
  );
}

export default function HisobotPage() {
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/hisobot?days=${days}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setReport)
      .catch(() => setReport(emptyReport))
      .finally(() => setLoading(false));
  }, [days]);

  const cards = [
    { label: "Sahifa ko‘rishlar", value: report.kpi.views, icon: Eye, color: "#38bdf8" },
    { label: "Noyob tashrifchilar", value: report.kpi.unique, icon: Users, color: "#a855f7" },
    { label: "Ro‘yxatdan o‘tgan", value: report.kpi.registered, icon: UserPlus, color: "#22c55e" },
    { label: "Hozir online", value: report.kpi.online, icon: Activity, color: "#f59e0b" },
  ];
  const maxTrend = Math.max(1, ...report.trend.map((item) => item.views));

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hisobot</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Saytning real tashrif statistikasi</p>
        </div>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-xl px-3 py-2 bg-black/20 text-white" style={{ border: "1px solid var(--border)" }}>
          <option value={1}>Bugun</option>
          <option value={7}>7 kun</option>
          <option value={30}>30 kun</option>
        </select>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return <div key={card.label} className="p-5 rounded-2xl" style={{ background: "linear-gradient(145deg,rgba(19,18,32,.96),rgba(10,11,20,.96))", border: `1px solid ${card.color}60` }}>
            <Icon className="h-6 w-6" style={{ color: card.color }} />
            <p className="mt-4 text-3xl font-bold text-white">{card.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
          </div>;
        })}
      </div>

      <section className="rounded-2xl p-5 mb-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between gap-3 mb-5"><h2 className="font-semibold text-white">Tashriflar dinamikasi</h2><MonitorSmartphone className="h-5 w-5 text-violet-300" /></div>
        <div className="h-40 flex items-end gap-1.5">
          {report.trend.map((point) => <div key={point.day} title={`${point.day}: ${point.views} ko‘rish, ${point.visitors} tashrifchi`} className="flex-1 min-w-1 rounded-t bg-gradient-to-t from-violet-700 to-fuchsia-400 transition-opacity hover:opacity-80" style={{ height: `${Math.max(3, (point.views / maxTrend) * 100)}%` }} />)}
          {!report.trend.length && <p className="m-auto text-sm" style={{ color: "var(--text-muted)" }}>Tashriflar kelishi bilan grafik paydo bo‘ladi.</p>}
        </div>
        <div className="flex justify-between text-xs mt-3" style={{ color: "var(--text-muted)" }}><span>{days === 1 ? "Bugun" : `${days} kun oldin`}</span><span>{loading ? "Yangilanmoqda…" : "Bugun"}</span></div>
      </section>

      <div className="grid lg:grid-cols-2 2xl:grid-cols-4 gap-4">
        <StatList title="Eng ko‘p ko‘rilgan sahifalar" items={report.paths} itemKey="path" />
        <StatList title="Trafik manbalari" items={report.sources} itemKey="source" />
        <StatList title="Qurilmalar" items={report.devices} itemKey="device" />
        <StatList title="Brauzerlar" items={report.browsers} itemKey="browser" />
      </div>

      <p className="mt-6 rounded-xl p-4 text-sm" style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(168,85,247,.25)", color: "var(--text-secondary)" }}>
        Hisobot real tashrif eventlaridan tuziladi. Botlar va qidiruv tizimi crawlerlari hisobga olinmaydi. Mehmon tashrifchilar anonim identifikator orqali sanaladi.
      </p>
    </div>
  );
}
