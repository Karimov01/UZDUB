import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qidiruv",
  robots: { index: false, follow: true },
  alternates: { canonical: "/qidirish" },
};

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
