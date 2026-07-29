import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Middleware faqat edge-safe authConfig'ni ishlatadi (Credentials provayder Node'da qoladi).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Login sahifasi himoyalanmagan (aks holda cheksiz redirect bo'ladi)
  if (pathname === "/admin/login") return NextResponse.next();

  if (req.auth) return NextResponse.next();

  // API'lar uchun tushunarli 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Ruxsat yo'q. Avval admin tizimiga kiring." },
      { status: 401 }
    );
  }

  // Admin sahifalar uchun login'ga yo'naltirish
  const url = new URL("/admin/login", req.nextUrl.origin);
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/admin/:path*", "/api/ai-fill", "/api/ai-fill-episode", "/api/upload", "/api/movies/:path*", "/api/settings"],
};
