import type { NextAuthConfig } from "next-auth";

// Edge-safe konfiguratsiya (middleware shu qismni ishlatadi — Node provayderlarsiz).
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      const userId = typeof token.id === "string" ? token.id : token.sub;
      if (session.user && typeof userId === "string") session.user.id = userId;
      return session;
    },
  },
  providers: [],
};
