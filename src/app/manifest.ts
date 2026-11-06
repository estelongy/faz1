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
    // PWA KARE ikon ister (192 ve 512). Eskiden favicon.ico (minik) ve
    // opengraph-image (1200x630, dikdortgen) vardi; Android gecerli ikon
    // bulamayinca manifesti kurulabilir saymiyor, start_url'u yok sayip
    // o anki sayfayi/anasayfayi kaydediyordu. /tavsiye'den kurulan
    // kisayolun anasayfa acmasinin sebebi buydu.
    icons: [
      { src: '/klinik-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/klinik-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/klinik-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
