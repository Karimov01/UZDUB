import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1400, 1920],
    imageSizes: [48, 64, 96, 160, 210, 342, 430],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Admin yuklagan posterlar (Cloudflare R2)
        protocol: "https",
        hostname: "cdn.uzdub.com",
      },
    ],
  },
};

export default nextConfig;
