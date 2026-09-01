export type ContentType = "MOVIE" | "SERIAL" | "CARTOON" | "DOCUMENTARY" | "SHOW";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  color?: string;
}

export interface Actor {
  id: string;
  name: string;
  slug: string;
  photoUrl?: string;
  character?: string;
  order?: number;
}

export interface Director {
  id: string;
  name: string;
  slug: string;
  photoUrl?: string;
}

export interface Episode {
  id: string;
  movieId: string;
  season: number;
  episode: number;
  title: string;
  description?: string;
  previewUrl?: string;
  videoUrl?: string;
  duration?: number;
  aiProcessedAt?: string;
  viewCount: number;
  airDate?: string;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  completed?: boolean;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  description: string;
  shortDesc?: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  videoUrl?: string;
  type: ContentType;
  status: ContentStatus;

  year?: number;
  duration?: number;
  country?: string;
  language?: string;
  dubbing?: string;
  subtitles?: string[];

  imdbRating?: number;
  kinopoiskRating?: number;
  internalRating?: number;
  ratingCount?: number;
  viewCount?: number;

  isFeatured?: boolean;
  isTrending?: boolean;
  isPremium?: boolean;
  isComingSoon?: boolean;
  isRussian?: boolean;
  isTrailer?: boolean;

  seoTitle?: string;
  seoDescription?: string;

  genres?: Genre[];
  cast?: Actor[];
  directors?: Director[];
  screenshots?: string[];
  episodes?: Episode[];

  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Bosh sahifa kartasi uchun faqat renderga kerak bo'ladigan yengil ma'lumot. */
export type MovieCardData = Pick<
  Movie,
  | "id"
  | "slug"
  | "title"
  | "posterUrl"
  | "status"
  | "type"
  | "year"
  | "duration"
  | "imdbRating"
  | "viewCount"
  | "isTrending"
  | "isPremium"
  | "isComingSoon"
  | "isRussian"
  | "publishedAt"
  | "genres"
> & {
  backdropUrl?: string;
  shortDesc?: string;
  latestSeason?: number;
  latestEpisode?: number;
};

/** Hero uchun karta ma'lumotidan tashqari zarur qisqa metadata. */
export type HeroMovieData = MovieCardData &
  Pick<
    Movie,
    | "backdropUrl"
    | "shortDesc"
    | "country"
    | "dubbing"
    | "isFeatured"
    | "genres"
  >;

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface WatchHistory {
  movieId: string;
  episodeId?: string;
  progress: number;
  duration: number;
  completed: boolean;
  watchedAt: string;
  movie?: Movie;
}

export interface DashboardStats {
  totalMovies: number;
  totalSerials: number;
  todayViews: number;
  activeUsers: number;
  newUsers30d: number;
  pendingComments: number;
}
