import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";

// To'liq konfiguratsiya (Node runtime) — bitta admin, .env dagi email/parol bilan.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parol", type: "password" },
      },
      authorize: async (creds) => {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) return null;
        if (creds?.email === email && creds?.password === password) {
          return { id: "admin", email, name: "Administrator" };
        }
        return null;
      },
    }),
  ],
});
