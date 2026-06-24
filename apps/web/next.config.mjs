/**
 * Configuração do Next.js com headers de segurança aplicados globalmente.
 * Ver docs/05-frontend.md (seção Segurança no frontend) e docs/06-seguranca-e-lgpd.md.
 */

/** Backend NestJS — usado pelo rewrite para manter cookies same-origin no browser. */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3333';
const isDev = process.env.NODE_ENV !== 'production';
/** Docker força standalone; Vercel usa serverless nativo. */
const useStandalone = !process.env.VERCEL && process.env.DOCKER_BUILD === '1';

/**
 * CSP em dev precisa permitir scripts inline/eval e WebSocket (HMR do Next.js).
 * Em produção mantemos política mais restritiva.
 */
const contentSecurityPolicy = isDev
  ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' ws: wss:",
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
      "script-src 'self'",
      // Tailwind/React aplicam estilos inline (style="") e next/font injeta <style>.
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
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
  // standalone é só para Docker; na Vercel (VERCEL=1) quebra serverless functions.
  ...(useStandalone ? { output: 'standalone' } : {}),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
