import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Estelongy — Gençlik Skoru Platformu',
    short_name: 'Estelongy',
    description: 'AI destekli longevity ve estetik sağlık platformu. Estelongy Gençlik Skorunu öğren.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait',
    lang: 'tr-TR',
    categories: ['health', 'lifestyle', 'medical'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/opengraph-image',
        sizes: '1200x630',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
