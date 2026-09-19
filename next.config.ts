import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days cache for optimized images
    remotePatterns: [
      { protocol: "https", hostname: "**.bakingo.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
