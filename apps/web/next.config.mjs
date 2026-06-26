/**
 * Configuração do Next.js com headers de segurança aplicados globalmente.
 * Ver docs/05-frontend.md e docs/06-seguranca-e-lgpd.md.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const isDev = process.env.NODE_ENV !== 'production';
const useStandalone = !process.env.VERCEL && process.env.DOCKER_BUILD === '1';

const connectSrc = ["'self'", supabaseUrl].filter(Boolean).join(' ');

const contentSecurityPolicy = isDev
  ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `connect-src ${connectSrc} ws: wss:`,
      "style-src 'self' 'unsafe-inline'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "font-src 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; ')
  : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(useStandalone ? { output: 'standalone' } : {}),
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
