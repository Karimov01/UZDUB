import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin panel va shaxsiy sahifalar qidiruv tizimlaridan yashiriladi
        disallow: ["/admin", "/admin/", "/kirish", "/api/"],
      },
      // Yandex uchun alohida qoida (Yandexbot ba'zan umumiy qoidani e'tiborsiz qoldiradi)
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin", "/admin/", "/kirish", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
