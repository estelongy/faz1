import { NextResponse } from 'next/server'

/**
 * Önek bilinmeden kurulan kısayolun manifesti.
 *
 * Referansör panel adresini (/tavsiye/DH6GOK) hatırlamak zorunda değil;
 * /tavsiye kapısından telefonla girer. Kısayolu bu kapıdan kurarsa
 * start_url burayı göstermeli — eskiden bu sayfada manifest hiç yoktu,
 * iOS da manifest okumadığı için ikon Estelongy anasayfasına düşüyordu.
 *
 * scope /tavsiye: kendi paneline geçtiğinde uygulamadan çıkmaz.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    name: 'Tavsiye Panelim',
    short_name: 'Tavsiye',
    description: 'Kod üret, puanını gör, referanslarını takip et.',
    start_url: '/tavsiye',
    scope: '/tavsiye',
    id: '/tavsiye',
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
