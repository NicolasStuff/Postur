import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Utiliser le plugin next-intl avec le fichier de configuration
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const isDevelopment = process.env.NODE_ENV !== "production"
// 'unsafe-inline' required for Next.js inline scripts and styles.
// TODO: migrate to nonce-based CSP when Next.js App Router supports it natively.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.axept.io https://static.axept.io${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.g.doubleclick.net https://www.google.com https://www.google.fr",
  "font-src 'self' data:",
  `connect-src 'self' https://cdnjs.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.axept.io${isDevelopment ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
  "frame-src 'self' https://td.doubleclick.net https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ")

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    reactCompiler: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
};

export default withNextIntl(nextConfig);
