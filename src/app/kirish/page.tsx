import type { Metadata } from "next";
import TelegramLoginCard from "@/components/auth/TelegramLoginCard";
export const metadata: Metadata = { title: "Kirish" };
export default function KirishPage() { return <div className="min-h-[80vh] flex items-center justify-center px-4 py-12"><TelegramLoginCard /></div>; }
