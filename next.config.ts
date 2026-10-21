import type { NextConfig } from 'next';
import { siteConfig } from './config/site';

/**
 * `www.` and the bare domain both served the full site, so every page existed
 * at two URLs. The canonical tag points Google at the bare domain, but a
 * permanent redirect is what actually consolidates links and crawl onto one
 * host. Derived from the canonical origin, so it follows a domain change.
 */
const canonical = new URL(siteConfig.url);
const wwwRedirects =
  canonical.hostname.startsWith('www.') || canonical.hostname === 'localhost'
    ? []
    : [
        {
          source: '/:path*',
          has: [{ type: 'host' as const, value: `www.${canonical.hostname}` }],
          destination: `${canonical.origin}/:path*`,
          permanent: true,
        },
      ];

// React Refresh eval()s modules in development; a production build never does.
const isDev = process.env.NODE_ENV !== 'production';

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' stays for now: Next.js emits an unhashed inline bootstrap
  // script, and removing it needs a nonce threaded from middleware through the
  // document. 'unsafe-eval' has no such excuse in a production build.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com https://*.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.razorpay.com",
  "frame-src 'self' https://api.razorpay.com https://*.razorpay.com",
  "connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@react-pdf/renderer', 'razorpay', 'nodemailer'],
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  async redirects() {
    return wwwRedirects;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
