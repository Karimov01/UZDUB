import { auth } from "@/auth";
import { getUserProfile, isOnlyAdministrativeUser } from "@/lib/movies-store";

export async function getAdminAccess() {
  const session = await auth();
  const id = session?.user?.id;
  const isCredentialsAdmin = id === "admin" || session?.user?.email === process.env.ADMIN_EMAIL;
  const profile = id && !isCredentialsAdmin ? await getUserProfile(id) : undefined;
  const isAdmin = isCredentialsAdmin || profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
  const canManageTelegramNotifications = isCredentialsAdmin || profile?.role === "SUPER_ADMIN" || (profile?.role === "ADMIN" && await isOnlyAdministrativeUser(profile.id));
  return { isAdmin, canManageTelegramNotifications, profile };
}
