import type { NextConfig } from 'next';

/**
 * Security headers applied to every response.
 *
 * A Content-Security-Policy is intentionally NOT set here yet: it needs a
 * per-request nonce to work with the Next.js runtime, which belongs in
 * middleware. It is scheduled for M8 (Beta Hardening) together with the
 * security regression suite.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders.map((header) => ({ ...header })),
    },
  ],
};

export default nextConfig;
