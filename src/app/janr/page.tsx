import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedMovies } from "@/lib/movies";

export const revalidate = 60;

export const metadata: Metadata = { title: "Janrlar" };

const genres = [
  { slug: "drama", name: "Drama", emoji: "🎭", color: "#7C3AED" },
  { slug: "harakatli", name: "Harakatli", emoji: "💥", color: "#F59E0B" },
  { slug: "triller", name: "Triller", emoji: "😱", color: "#EF4444" },
  { slug: "ilmiy-fantastika", name: "Ilmiy Fantastika", emoji: "🚀", color: "#06B6D4" },
  { slug: "fantastik", name: "Fantastik", emoji: "🧙", color: "#8B5CF6" },
  { slug: "jinoyat", name: "Jinoyat", emoji: "🔫", color: "#6366F1" },
  { slug: "komediya", name: "Komediya", emoji: "😄", color: "#EC4899" },
  { slug: "romantik", name: "Romantik", emoji: "❤️", color: "#F43F5E" },
  { slug: "tarix", name: "Tarixiy", emoji: "🏛️", color: "#14B8A6" },
  { slug: "multfilm", name: "Multfilm", emoji: "🎠", color: "#F97316" },
  { slug: "dahshat", name: "Dahshat", emoji: "👻", color: "#DC2626" },
  { slug: "musiqa", name: "Musiqa", emoji: "🎵", color: "#10B981" },
];

export default async function JanrlarPage() {
  const movies = await getPublishedMovies();
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Janrlar
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        O&apos;zingizga yoqqan janrni tanlang
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {genres.map((genre) => {
          const count = movies.filter((m) => m.genres?.some((g) => g.slug === genre.slug)).length;
          return (
            <Link key={genre.slug} href={`/janr/${genre.slug}`}>
              <div
                className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${genre.color}22 0%, ${genre.color}11 100%)`,
                  border: `1px solid ${genre.color}44`,
                }}
              >
                <div className="text-4xl mb-3">{genre.emoji}</div>
                <h3 className="font-semibold text-white text-base mb-1">{genre.name}</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {count > 0 ? `${count} ta kino` : "Yangi kinolar"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
