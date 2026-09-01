import type { Movie } from "@/types/movie";

/** Local UI review only. This mode is unreachable in production builds. */
export const isLocalAdminPreview = () => process.env.NODE_ENV !== "production" && process.env.ADMIN_LOCAL_PREVIEW === "1";

const now = new Date().toISOString();

export const adminPreviewMovies: Movie[] = [
  ["preview-1", "qochqinlar-yoli", "Qochqinlar yo'li", "The Long Escape", "MOVIE", 2026, 8.7, 12458, "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=85"],
  ["preview-2", "minora-2-olik-nuqta", "Minora 2: O'lik nuqta", "Fall 2: Deadpoint", "MOVIE", 2026, 5.6, 8932, "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=85"],
  ["preview-3", "jumanji-4-ajoyib-qochish", "Jumanji 4: Ajoyib qochish", "Jumanji: Open World", "MOVIE", 2026, 7.9, 15210, "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=85"],
  ["preview-4", "tort-qol-ijrosidagi-ikki-sonata", "To'rt qo'l ijrosidagi ikki sonata", "Four Hands, Two Sonatas", "SERIAL", 2025, 9.5, 21774, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=85"],
  ["preview-5", "choson-nikoh-agentligi", "Choson nikoh agentligi", "Flower Crew: Joseon Marriage Agency", "SERIAL", 2013, 6.1, 9114, "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=85"],
  ["preview-6", "samuray-qoshigi", "Samuray qo'shig'i", "Song of the Samurai – Chapter: Edo", "SERIAL", 2025, 9.2, 14887, "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=400&q=85"],
  ["preview-7", "senga-bolgan-muhabbat", "Senga bo'lgan muhabbat", "Love For You", "SERIAL", 2025, 8.8, 11973, "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=85"],
  ["preview-8", "million-dollarlik-tuzoq", "Million dollarlik tuzoq", "Million Dollar Trap", "MOVIE", 2026, 7.3, 10556, "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=85"],
  ["preview-9", "suvdagi-qotil", "Suvdagi qotil", "Deep Killer", "MOVIE", 2026, 7.1, 6842, "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=85"],
  ["preview-10", "vampirlar-kundaligi", "Vampirlar Kundaligi", "The Vampire Diaries", "SERIAL", 2013, 8.3, 13421, "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=400&q=85"],
].map(([id, slug, title, originalTitle, type, year, imdbRating, viewCount, posterUrl]) => ({
  id: String(id), slug: String(slug), title: String(title), originalTitle: String(originalTitle),
  description: "Mahalliy admin dizaynini xavfsiz ko'rib chiqish uchun namunaviy kontent.",
  type: type as Movie["type"], status: "PUBLISHED", year: Number(year), imdbRating: Number(imdbRating),
  viewCount: Number(viewCount), posterUrl: String(posterUrl), country: "AQSh", language: "Ingliz tili",
  dubbing: "O'zbek", duration: 97, videoUrl: "https://player.uzdub.net/embed/preview",
  trailerUrl: "https://youtube.com/watch?v=preview", genres: [{ id: "preview-genre", name: "Drama", slug: "drama" }],
  createdAt: now, updatedAt: now,
}));
