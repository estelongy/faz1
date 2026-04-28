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
          '/satici/panel/',
          '/admin/',
          '/api/',
          '/analiz',
          '/skor',
          '/sepet',
          '/odeme',
          '/siparis/',
          '/paylas/',
          '/kurumsal/',
          '/auth/',
          // Magaza filtre/arama URL'leri (duplicate content)
          '/magaza?*',
        ],
      },
      // GPT/Claude/Perplexity gibi AI botlara da SEO içeriğini aç
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
        allow: ['/', '/rehber/', '/magaza', '/hakkinda/'],
        disallow: ['/panel/', '/klinik/panel/', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://estelongy.com/sitemap.xml',
    host: 'https://estelongy.com',
  }
}
