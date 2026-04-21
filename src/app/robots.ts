import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/panel/',
          '/klinik/panel/',
          '/admin/',
          '/api/',
          '/analiz',
          '/anket',
          '/sepet',
          '/siparis/',
          '/paylas/',
        ],
      },
    ],
    sitemap: 'https://estelongy.com/sitemap.xml',
  }
}
