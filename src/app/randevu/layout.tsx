import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Randevu Al — Onaylı Estetik Klinikleri',
  description: 'Estelongy\'deki onaylı estetik kliniklerinden kolayca randevu al. Hekim onayıyla Klinik Onaylı Estelongy Gençlik Skoru kazan.',
  alternates: { canonical: '/randevu' },
  openGraph: {
    title: 'Randevu Al — Estelongy',
    description: 'Onaylı estetik kliniklerinden anlık müsaitlik ile randevu al.',
    url: '/randevu',
    type: 'website',
  },
}

export default function RandevuLayout({ children }: { children: React.ReactNode }) {
  return children
}
