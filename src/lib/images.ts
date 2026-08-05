/** TMDB original rasmlarini foydalanuvchi ekraniga mos o'lchamga tushiradi. */
export function optimizedTmdbImage(url: string | undefined, size: "poster" | "backdrop"): string | undefined {
  if (!url?.startsWith("https://image.tmdb.org/t/p/")) return url;
  return url.replace("/t/p/original/", `/t/p/${size === "poster" ? "w342" : "w1280"}/`)
    .replace("/t/p/w500/", `/t/p/${size === "poster" ? "w342" : "w1280"}/`);
}
