import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Görsel optimizasyonu: Supabase + Vercel blob'larına izin ver
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.vercel-storage.com' },
    ],
  },

  // Legacy URL redirects
  async redirects() {
    return [
      // jeton → kredi
      { source: '/klinik/panel/jeton',          destination: '/klinik/panel/kredi', permanent: true },
      { source: '/klinik/panel/jeton/:path*',   destination: '/klinik/panel/kredi/:path*', permanent: true },
      // /magaza → /estestore (rebrand)
      { source: '/magaza',                      destination: '/estestore', permanent: true },
      { source: '/magaza/:path*',               destination: '/estestore/:path*', permanent: true },
      // EsteKlinik dünya birleştirme: eski public rotalar /klinikler/* altına
      // EsteKlinik dünya umbrellası /esteklinik/* — eski rotalar
      { source: '/randevu',                     destination: '/esteklinik', permanent: true },
      { source: '/esteklinik/randevu',          destination: '/esteklinik', permanent: true },
      { source: '/klinik/basvur',               destination: '/esteklinik/basvur', permanent: true },
      { source: '/klinikler',                   destination: '/esteklinik', permanent: true },
      { source: '/klinikler/:path*',            destination: '/esteklinik/:path*', permanent: true },
      // /klinik/<slug> → /esteklinik/<slug> (admin path'lerini hariç tut)
      { source: '/klinik/:slug((?!panel$|panel/|muhasebe-ozet$|muhasebe-ozet/|basvur$).+)', destination: '/esteklinik/:slug', permanent: true },
    ]
  },

  // Güvenlik başlıkları
  async headers() {
    // Content-Security-Policy — XSS / data exfiltration savunması.
    // Next.js inline script ve Tailwind JIT için 'unsafe-inline' gerekiyor;
    // bu olmadan sayfa render olmaz. Production-pragmatic seviyede.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.sentry.io https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          // İçerik tipi sniffing engeli
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          // Clickjacking — iframe'lemeyi tamamen yasakla (CSP frame-ancestors 'none' modern eşdeğeri)
          { key: 'X-Frame-Options',           value: 'DENY' },
          // X-XSS-Protection deprecated — '0' önerilen (modern browser CSP kullanıyor)
          { key: 'X-XSS-Protection',          value: '0' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // HSTS — preload ekle, 2 yıl
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // İzin politikası
          { key: 'Permissions-Policy',        value: 'camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()' },
          // Cross-Origin izolasyonu
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // CSP
          { key: 'Content-Security-Policy',   value: csp },
        ],
      },
      // API route'larına cache yok
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },

  // Webpack: Sentry yüklenirse source map gönder
  // (Sentry paketi eklendiğinde otomatik devreye girer)
  experimental: {
    serverActions: {
      // Server action body limit: 4MB (selfie upload için)
      bodySizeLimit: '4mb',
    },
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry organizasyon ve proje (env'den veya hardcode)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Source map'leri Sentry'ye yükle, build'dan sil
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,

  // Vercel'de otomatik araçlama
  automaticVercelMonitors: true,
})
