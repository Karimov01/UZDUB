export const APP_NAME = "UZDUB Play";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// SEO — Google & Yandex uchun asosiy meta ma'lumotlar
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://uzdub.com").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "O'zbekistonning eng yaxshi kino va serial platformasi. Yangi kinolar, seriallar va multfilmlarni HD sifatda, o'zbek tilida onlayn tomosha qiling.";
export const SITE_KEYWORDS = [
  "kino", "kinolar", "serial", "seriallar", "multfilm", "o'zbek kino", "o'zbek tilida kino",
  "hd kino", "online kino", "kino ko'rish", "uzbek kino", "premyera", "yangi kinolar",
  "uzdub", "uzdub play", "tarjima kino", "dublyaj", "tomosha qilish",
];
export const SITE_LOCALE = "uz_UZ";

export const CONTENT_TYPES = {
  MOVIE: "Kino",
  SERIAL: "Serial",
  CARTOON: "Multfilm",
  DOCUMENTARY: "Hujjatli",
  SHOW: "Ko'rsatuv",
} as const;

export const ROLES = {
  USER: "USER",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const CONTENT_STATUS = {
  DRAFT: "Qoralama",
  PUBLISHED: "Nashr etilgan",
  ARCHIVED: "Arxivlangan",
} as const;

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VIDEO_QUALITIES = [
  { label: "Auto", value: "auto" },
  { label: "1080p HD", value: "1080" },
  { label: "720p HD", value: "720" },
  { label: "480p", value: "480" },
  { label: "360p", value: "360" },
];

export const AUDIO_TRACKS = [
  { label: "O'zbek", value: "uz" },
  { label: "Rus", value: "ru" },
  { label: "Original", value: "orig" },
];

export const SUBTITLE_TRACKS = [
  { label: "O'chirish", value: "off" },
  { label: "O'zbek", value: "uz" },
  { label: "Rus", value: "ru" },
  { label: "Ingliz", value: "en" },
];

export const NAV_LINKS = [
  { label: "Bosh sahifa", href: "/" },
  { label: "Kinolar", href: "/kino" },
  { label: "Seriallar", href: "/serial" },
  { label: "Top 10", href: "/top" },
  { label: "Janrlar", href: "/janr" },
];
