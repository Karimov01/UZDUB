import type { MetadataRoute } from "next";
import { APP_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — O'zbekistonning Premium Kino Platformasi`,
    short_name: APP_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#7C3AED",
    lang: "uz",
    categories: ["entertainment", "movies", "video"],
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" }],
  };
}
