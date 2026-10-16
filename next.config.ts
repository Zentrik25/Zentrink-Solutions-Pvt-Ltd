import type { NextConfig } from "next";

const CANONICAL_HOST = "zentriksolutions.com";
const isProd = process.env.NODE_ENV === "production";
// Only the real production deployment may be indexed (mirrors lib/seo.ts#isIndexable).
const indexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.ALLOW_INDEXING === "1";

const csp = [
  "default-src 'self'",
  // Next.js emits inline bootstrap scripts; Google Tag Manager loads only after analytics consent.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "pg"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    // Vercel caps request bodies at 4.5 MB; enquiry attachments are limited to 4 MB in total.
    serverActions: {
      bodySizeLimit: "5mb",
      allowedOrigins: [CANONICAL_HOST],
    },
  },
  async redirects() {
    return [
      // www -> canonical apex, permanent (308). Also configure the same redirect on the Vercel domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${CANONICAL_HOST}` }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
      { source: "/blog", destination: "/insights", permanent: true },
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/quote", destination: "/request-a-quote", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Non-production deployments are never indexable, whatever robots.txt says.
      ...(indexable ? [] : [{ source: "/:path*", headers: [noindex] }]),
      // Admin and API responses are never cached, never indexed.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, noindex] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, noindex] },
      // The raw *.vercel.app alias of a production deployment must not compete with the canonical domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\\.vercel\\.app)" }],
        headers: [noindex],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
