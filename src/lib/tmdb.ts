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
interface TmdbResult {
  id: number;
  media_type?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  original_title?: string;
  original_name?: string;
  popularity?: number;
}

function pickByYear(results: TmdbResult[], year: string): TmdbResult {
  if (!year) return results[0];
  const yn = Number(year);
  const matched = results.find((r) => {
    const d = r.release_date || r.first_air_date || "";
    return d && Math.abs(Number(d.slice(0, 4)) - yn) <= 1;
  });
  return matched || results[0];
}

export async function fetchTmdb(query: string, year: string, type: string): Promise<TmdbInfo> {
  const key = process.env.TMDB_API_KEY;
  if (!key || !query) return { found: false };

  const isTv = type === "SERIAL";
  const kind = isTv ? "tv" : "movie";
  const q = encodeURIComponent(query.trim());

  try {
    // 1) To'g'ridan qidiruv (YILSIZ — keyin natijalardan yilga mos tanlaymiz)
    let results: TmdbResult[] = [];
    const s = await fetch(`https://api.themoviedb.org/3/search/${kind}?api_key=${key}&query=${q}&language=en-US&include_adult=false`);
    if (s.ok) results = (await s.json()).results || [];

    // 2) Topilmasa — multi-search (kino + serial + odam) dan mos turdagisi
    if (!results.length) {
      const m = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${q}&language=en-US&include_adult=false`);
      if (m.ok) {
        const all: TmdbResult[] = (await m.json()).results || [];
        results = all.filter((r) => r.media_type === kind || (!r.media_type && (r.original_title || r.original_name)));
      }
    }

    if (!results.length) return { found: false };

    const hit = pickByYear(results, year);
    const hitKind = hit.media_type === "tv" ? "tv" : hit.media_type === "movie" ? "movie" : kind;

    // Tafsilotlar (davomiylik, janr, davlat)
    const d = await fetch(`https://api.themoviedb.org/3/${hitKind}/${hit.id}?api_key=${key}&language=en-US`);
    const dj = d.ok ? await d.json() : {};

    const date: string = hit.release_date || hit.first_air_date || "";
    return {
      found: true,
      overview: hit.overview || dj.overview || "",
      posterUrl: hit.poster_path ? `${IMG}/w500${hit.poster_path}` : undefined,
      backdropUrl: hit.backdrop_path ? `${IMG}/original${hit.backdrop_path}` : undefined,
      genres: (dj.genres as TmdbGenre[] | undefined)?.map((g) => g.name) ?? [],
      runtime: hitKind === "tv" ? dj.episode_run_time?.[0] : dj.runtime,
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
