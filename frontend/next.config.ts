import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Хосты, с которых разрешено грузить аватары и обложки.
     * Добавляйте сюда домен вашего хранилища вместо того, чтобы открывать всё.
     */
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
