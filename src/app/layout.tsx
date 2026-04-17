import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Estelongy — Yapay Zeka Destekli Cilt Yaşlanma Analizi',
    template: '%s | Estelongy',
  },
  description: 'Selfie ile biyolojik cilt yaşınızı öğrenin. EGS (Estelongy Gençlik Skoru) ile AI analizi, longevity anketi ve klinik onaylı sertifika.',
  keywords: ['cilt analizi', 'yapay zeka', 'EGS skoru', 'cilt yaşlanma', 'klinik', 'estetik'],
  openGraph: {
    title: 'Estelongy — Cilt Yaşınızı Öğrenin',
    description: 'Selfie ile biyolojik cilt yaşınızı öğrenin. AI analizi ve klinik onaylı EGS skoru.',
    locale: 'tr_TR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
