/** @type {import('next').NextConfig} */

// Content-Security-Policy: ajuste os domínios de imagem conforme os hosts
// reais das fotos de produto que você for usar (Shopee usa vários CDNs
// diferentes por região — adicione o domínio exato que aparecer nos seus
// testes em vez de liberar tudo).
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').trim();

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // esconde o header "X-Powered-By: Next.js"
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.susercontent.com' },
      { protocol: 'https', hostname: 'down-*.img.susercontent.com' },
      { protocol: 'https', hostname: 'cf.shopee.com.br' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Força sempre www ou sempre non-www — ajuste ao seu domínio final
      // para não ter conteúdo duplicado (ruim para SEO).
    ];
  },
};

module.exports = nextConfig;
