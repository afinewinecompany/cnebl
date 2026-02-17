import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Typed routes disabled during development
  // Enable once all routes are defined for better TypeScript support
  // typedRoutes: true,
};

export default nextConfig;
