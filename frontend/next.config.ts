import type { NextConfig } from 'next';
const api = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001').replace(/\/+$/, '');
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https: http: https://accounts.google.com https://challenges.cloudflare.com; frame-src https://accounts.google.com https://challenges.cloudflare.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` },
      { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }];
  },
};
export default nextConfig;
