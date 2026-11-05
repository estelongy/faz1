import { NextResponse } from 'next/server'

/**
 * Referansöre özel PWA manifesti.
 *
 * Eskiden tek statik dosya vardı (public/tavsiye-manifest.json) ve
 * start_url ".", yani GÖRELI yoldu. Göreli yol manifestin kendi konumuna
 * göre çözümlenir — manifest kökteydi, dolayısıyla kurulan kısayol
 * anasayfayı açıyordu, paneli değil.
 *
 * Artık manifest öneğin altından sunuluyor ve start_url tam panel adresi.
 * Kurulan kısayol doğrudan o referansörün paneline düşer.
 */
export const dynamic = 'force-dynamic'

export function GET(
  _req: Request,
  { params }: { params: { onek: string } },
) {
  const onek = params.onek.toUpperCase()

  return NextResponse.json({
    name: `Tavsiye Panelim · ${onek}`,
    short_name: 'Tavsiye',
    description: 'Kod üret, puanını gör, referanslarını takip et.',
    start_url: `/tavsiye/${onek}`,
    scope: `/tavsiye/${onek}`,
    id: `/tavsiye/${onek}`,
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    orientation: 'portrait',
    lang: 'tr-TR',
    categories: ['business', 'lifestyle'],
    icons: [
      { src: '/klinik-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/klinik-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/klinik-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-store',
    },
  })
}
