"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import YandexAd from "@/components/ads/YandexAd";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <YandexAd blockId="R-A-19801166-12" />
        {children}
      </main>
      <Footer />
    </>
  );
}
