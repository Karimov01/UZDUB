import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock3, Crown, Film, Heart, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { getUserListIds, getUserProfile, getWatchProgresses } from "@/lib/movies-store";
import { getAllMovies } from "@/lib/movies";
import MovieCard from "@/components/movie/MovieCard";
import ContinueWatchingCard from "@/components/profile/ContinueWatchingCard";
import ProfileLogoutButton from "@/components/profile/ProfileLogoutButton";
import type { Movie } from "@/types/movie";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Profilim",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/kirish");
  const [user, favorites, later, progress, movies] = await Promise.all([
    getUserProfile(session.user.id), getUserListIds(session.user.id, "FAVORITE"), getUserListIds(session.user.id, "WATCH_LATER"), getWatchProgresses(session.user.id), getAllMovies(),
  ]);
  if (!user) redirect("/kirish");
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Foydalanuvchi";
  const isPremium = user.subscriptionType === "PREMIUM" && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());
  const pick = (ids: string[]): Movie[] => ids.map((id) => movies.find((movie) => movie.id === id)).filter((movie): movie is Movie => Boolean(movie)).slice(0, 5);
  const continueItems = progress.map((item) => ({ progress: item, movie: movies.find((movie) => movie.id === item.movieId) })).filter((item): item is { progress: typeof progress[number]; movie: Movie } => Boolean(item.movie));

  return <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12" style={{ background: "var(--bg-primary)" }}>
    <section className="rounded-3xl p-5 md:p-8" style={{ background: "linear-gradient(135deg, rgba(29,20,49,.96), rgba(11,13,25,.96))", border: "1px solid rgba(167,139,250,.25)", boxShadow: "0 18px 55px rgba(0,0,0,.3)" }}>
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center"><div className="h-24 w-24 rounded-full p-0.5 shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}><div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center bg-violet-950 text-3xl font-bold text-white">{user.telegramPhotoUrl ? <img src={user.telegramPhotoUrl} alt={name} className="h-full w-full object-cover" /> : user.firstName[0]}</div></div><div><h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">{name}<ShieldCheck className="h-5 w-5 text-violet-400" /></h1><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Telegram foydalanuvchisi</p><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>A&apos;zo bo&apos;lgan sana: {new Date(user.createdAt).toLocaleDateString("uz-UZ")}</p><span className="inline-flex mt-3 items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ color: isPremium ? "#f5d0fe" : "#ddd6fe", background: isPremium ? "rgba(236,72,153,.16)" : "rgba(124,58,237,.14)" }}>{isPremium ? <Crown className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}{user.role === "ADMIN" ? "Admin" : isPremium ? "Premium" : "Oddiy"}</span></div></div>
    </section>
    <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">{[{ icon: Heart, label: "Saqlanganlar", value: favorites.length }, { icon: Clock3, label: "Keyin ko'raman", value: later.length }, { icon: Film, label: "Premium xizmat", value: "Tez kunda" }].map((item) => <div key={item.label} className="rounded-2xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}><item.icon className="h-5 w-5 text-violet-400" /><p className="mt-3 text-2xl font-bold text-white">{item.value}</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.label}</p></div>)}</section>
    {continueItems.length ? <section className="mt-8"><h2 className="text-xl font-bold text-white mb-4">Davom ettirish</h2><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{continueItems.map((item) => <ContinueWatchingCard key={`${item.progress.movieId}-${item.progress.episodeId ?? "movie"}`} movie={item.movie} progress={item.progress} />)}</div></section> : null}
    <ProfileRow title="Saqlanganlar" items={pick(favorites)} empty="Saqlangan kinolaringiz hozircha yo'q." />
    <ProfileRow title="Keyin ko'raman" items={pick(later)} empty="Keyin ko'raman ro'yxatingiz hozircha bo'sh." />
    <ProfileLogoutButton />
  </div>;
}

function ProfileRow({ title, items, empty }: { title: string; items: Movie[]; empty: string }) {
  return <section className="mt-8"><h2 className="text-xl font-bold text-white mb-4">{title}</h2>{items.length ? <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map((movie) => <div key={movie.id} className="w-36 shrink-0"><MovieCard movie={movie} /></div>)}</div> : <p className="rounded-2xl p-5 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{empty}</p>}</section>;
}
