// TMDB — kino/serial haqida real ma'lumot va poster/backdrop olish
const IMG = "https://image.tmdb.org/t/p";

export interface TmdbInfo {
  found: boolean;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[]; // inglizcha nomlar
  runtime?: number;
  rating?: number;
  country?: string;
  language?: string;
  originalTitle?: string;
  year?: number;
}

interface TmdbGenre { name: string }
interface TmdbCountry { name: string }
interface TmdbLang { english_name: string }

export async function fetchTmdb(
  query: string,
  year: string,
  type: string
): Promise<TmdbInfo> {
  const key = process.env.TMDB_API_KEY;
  if (!key || !query) return { found: false };

  const isTv = type === "SERIAL";
  const kind = isTv ? "tv" : "movie";
  const yearParam = year ? (isTv ? `&first_air_date_year=${year}` : `&year=${year}`) : "";

  try {
    const s = await fetch(
      `https://api.themoviedb.org/3/search/${kind}?api_key=${key}&query=${encodeURIComponent(query)}${yearParam}&language=en-US`
    );
    if (!s.ok) return { found: false };
    const sj = await s.json();
    const hit = sj.results?.[0];
    if (!hit) return { found: false };

    // Tafsilotlar (davomiylik, janr, davlat)
    const d = await fetch(`https://api.themoviedb.org/3/${kind}/${hit.id}?api_key=${key}&language=en-US`);
    const dj = d.ok ? await d.json() : {};

    const date: string = hit.release_date || hit.first_air_date || "";
    return {
      found: true,
      overview: hit.overview || dj.overview || "",
      posterUrl: hit.poster_path ? `${IMG}/w500${hit.poster_path}` : undefined,
      backdropUrl: hit.backdrop_path ? `${IMG}/original${hit.backdrop_path}` : undefined,
      genres: (dj.genres as TmdbGenre[] | undefined)?.map((g) => g.name) ?? [],
      runtime: isTv ? dj.episode_run_time?.[0] : dj.runtime,
      rating: hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : undefined,
      country: (dj.production_countries as TmdbCountry[] | undefined)?.[0]?.name ?? "",
      language: (dj.spoken_languages as TmdbLang[] | undefined)?.[0]?.english_name ?? "",
      originalTitle: hit.original_title || hit.original_name || "",
      year: date ? Number(date.slice(0, 4)) : undefined,
    };
  } catch {
    return { found: false };
  }
}
