"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import YandexAd from "@/components/ads/YandexAd";
import YandexGlobalAds from "@/components/ads/YandexGlobalAds";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isTechnicalAuthPage = pathname === "/kirish" || pathname.startsWith("/auth/");
  const shouldShowAds = !isAdmin && !isTechnicalAuthPage;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        {shouldShowAds ? <YandexAd blockId="R-A-19801166-12" /> : null}
        {children}
      </main>
      <Footer />
      {shouldShowAds ? <YandexGlobalAds /> : null}
    </>
  );
}
