import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { consumeTelegramCompletion } from "@/lib/movies-store";
import { hashCompletionCode } from "@/lib/auth/telegram";

// To'liq konfiguratsiya (Node runtime) — bitta admin, .env dagi email/parol bilan.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: { code: { label: "Tasdiqlash kodi", type: "text" } },
      authorize: async (creds) => {
        const code = typeof creds?.code === "string" ? creds.code : "";
        if (!code) return null;
        const user = await consumeTelegramCompletion(hashCompletionCode(code));
        if (!user || !user.isActive) return null;
        return { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" "), image: user.telegramPhotoUrl, email: null };
      },
    }),
    Credentials({
      id: "admin-credentials",
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
