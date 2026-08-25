import HorizontalScroller from "@/components/home/HorizontalScroller";
import HomeMovieCard from "@/components/home/HomeMovieCard";
import SectionMoreButton from "@/components/home/SectionMoreButton";
import type { MovieCardData } from "@/types/movie";

interface CategoryRowProps {
  title: React.ReactNode;
  href?: string;
  movies: MovieCardData[];
  cardSize?: "sm" | "md" | "lg";
}

export default function CategoryRow({
  title,
  href,
  movies,
  cardSize = "md",
}: CategoryRowProps) {
  if (!movies.length) return null;

  return (
    <section className="py-6">
      {/* Header */}
      <div className="mx-auto mb-5 flex max-w-[1400px] items-center justify-between px-3 sm:px-4 md:px-8">
        <h2
          className="text-xl md:text-2xl font-bold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {href ? <SectionMoreButton href={href} /> : null}
      </div>

      {/* Scroll container */}
      <HorizontalScroller>{movies.map((movie) => <HomeMovieCard key={movie.id} movie={movie} size={cardSize} />)}</HorizontalScroller>
    </section>
  );
}
