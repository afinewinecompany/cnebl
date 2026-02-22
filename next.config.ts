import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.railway.app",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
      },
    ],
  },

  // Security headers
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    // Content Security Policy configuration
    // Note: 'unsafe-inline' for styles is required by Next.js for styled-jsx and CSS-in-JS
    // In production, we remove 'unsafe-eval' for better security
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: 'unsafe-inline' needed for Next.js hydration scripts
      // 'unsafe-eval' removed in production (only needed for dev hot reload)
      isProduction
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: 'unsafe-inline' required for Next.js styled-jsx and Tailwind
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Prevent loading of plugins
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ];

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
          ...(isProduction
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },

  // Typed routes disabled during development
  // Enable once all routes are defined for better TypeScript support
  // typedRoutes: true,
};

export default withBundleAnalyzer(nextConfig);
