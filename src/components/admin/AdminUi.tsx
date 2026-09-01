import type { ElementType, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("admin-card", className)}>{children}</section>;
}

export function AdminPageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center gap-4"><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h1>{subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}</div>{actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}</div>;
}

export function AdminToggle({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description?: string }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="group flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70">
    <span className={cn("relative h-6 w-11 shrink-0 rounded-full border transition", checked ? "border-violet-400/60 bg-gradient-to-r from-violet-600 to-fuchsia-500" : "border-white/10 bg-slate-700")}><span className={cn("absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform", checked ? "translate-x-[20px]" : "translate-x-0.5")} /></span>
    <span className="min-w-0"><span className="block text-sm font-medium text-slate-200 group-hover:text-white">{label}</span>{description ? <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{description}</span> : null}</span>
  </button>;
}

export function AdminGenreChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70", selected ? "border-violet-400/60 bg-gradient-to-r from-violet-600/90 to-fuchsia-500/80 text-white shadow-[0_0_18px_rgba(124,58,237,.15)]" : "border-white/10 bg-[#090d17] text-slate-400 hover:border-violet-400/40 hover:text-white")}>{children}{selected ? <Check className="h-4 w-4 rounded-full bg-white/90 p-0.5 text-violet-600" /> : null}</button>;
}

export function AdminStat({ icon: Icon, value, label, tone = "violet" }: { icon: ElementType; value: ReactNode; label: string; tone?: "violet" | "yellow" | "cyan" | "green" }) {
  const tones = { violet: "text-violet-400", yellow: "text-yellow-400", cyan: "text-cyan-400", green: "text-emerald-400" };
  return <div className="admin-card flex min-h-28 flex-col justify-center p-4"><div className="flex items-center gap-3"><Icon className={cn("h-5 w-5", tones[tone])} /><b className="text-xl text-slate-100">{value}</b></div><p className="mt-2 text-sm text-slate-400">{label}</p></div>;
}
