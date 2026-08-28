import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import JsonLd from "@/components/seo/JsonLd";
import { Analytics } from "@vercel/analytics/next";
import { APP_NAME, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_LOCALE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body-next", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display-next", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "UZDUB Play | O'zbekistonning premium kino platformasi", template: "%s | UZDUB Play" },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: APP_NAME,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  authors: [{ name: APP_NAME, url: SITE_URL }], creator: APP_NAME, publisher: APP_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: SITE_LOCALE, url: SITE_URL, siteName: APP_NAME, title: "UZDUB Play | O'zbekistonning premium kino platformasi", description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "UZDUB Play | O'zbekistonning premium kino platformasi", description: SITE_DESCRIPTION },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION, yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION },
  category: "entertainment",
};

const siteJsonLd = [
  { "@context": "https://schema.org", "@type": "WebSite", name: APP_NAME, url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: "uz", potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/qidirish?q={search_term_string}` }, "query-input": "required name=search_term_string" } },
  { "@context": "https://schema.org", "@type": "Organization", name: APP_NAME, url: SITE_URL, logo: `${SITE_URL}/favicon.svg` },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz" className={`h-full ${inter.variable} ${spaceGrotesk.variable}`}><body className="min-h-full antialiased flex flex-col"><Script id="adfinity-global" src="https://cdn.adfinity.pro/code/8414/adfinity.js" strategy="afterInteractive" async /><JsonLd data={siteJsonLd} /><ConditionalLayout>{children}</ConditionalLayout><Analytics /></body></html>;
}
