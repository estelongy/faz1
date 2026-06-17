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
          '/sunum/',
          '/analiz',
          '/skor',
          '/sepet',
          '/odeme',
          '/siparis/',
          '/paylas/',
          '/kurumsal/',
          '/auth/',
          // Magaza filtre/arama URL'leri (duplicate content)
          '/estestore?*',
        ],
      },
      // GPT/Claude/Perplexity gibi AI botlara da SEO içeriğini aç
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
        allow: ['/', '/rehber/', '/estestore', '/hakkinda/'],
        disallow: ['/panel/', '/klinik/panel/', '/admin/', '/api/', '/sunum/'],
      },
    ],
    sitemap: 'https://estelongy.com/sitemap.xml',
    host: 'https://estelongy.com',
  }
}
