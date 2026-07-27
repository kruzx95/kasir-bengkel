import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable unnecessary headers
  poweredByHeader: false,

  // Compiler: strip console in production (keep error/warn)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Images: allow remote patterns
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
