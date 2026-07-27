import type { NextAuthConfig } from "next-auth";

// Edge-safe konfiguratsiya (middleware shu qismni ishlatadi — Node provayderlarsiz).
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  providers: [],
};
