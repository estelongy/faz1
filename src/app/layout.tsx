import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthHashHandler from '@/components/AuthHashHandler'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://estelongy.com'

export const metadata: Metadata = {
  title: {
    default: 'Estelongy — Gençlik Skoru Platformu',
    template: '%s | Estelongy',
  },
  description: 'Estelongy Gençlik Skorunu öğren. Selfie ön analizi, longevity anketi, tetkikler ve hekim değerlendirmesiyle Klinik Onaylı Estelongy Gençlik Skoru sertifikası.',
  keywords: [
    'gençlik skoru',
    'Estelongy Gençlik Skoru',
    'klinik onaylı',
    'longevity',
    'biyolojik yaş',
    'estetik klinik',
    'cilt analizi',
    'AI cilt analizi',
    'estetik randevu',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  applicationName: 'Estelongy',
  authors: [{ name: 'Estelongy', url: SITE_URL }],
  creator: 'Estelongy',
  publisher: 'Estelongy',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    title: 'Estelongy — Gençlik Skorunu Öğren',
    description: 'Estelongy Gençlik Skorunu öğren. Ön analiz, longevity anketi ve klinik değerlendirmesiyle Klinik Onaylı Estelongy Gençlik Skoru.',
    url: SITE_URL,
    siteName: 'Estelongy',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estelongy — Gençlik Skorunu Öğren',
    description: 'Klinik Onaylı Estelongy Gençlik Skoru. Ön analiz, anket, tetkik ve hekim değerlendirmesi.',
    creator: '@estelongy',
    site: '@estelongy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'health',
  verification: {
    // Vercel env: NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION (opsiyonel — Search Console'dan alınca eklenir)
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Estelongy',
  legalName: 'Vestoriq OÜ',
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  sameAs: [
    'https://www.instagram.com/estelongy',
    'https://twitter.com/estelongy',
    'https://www.linkedin.com/company/estelongy',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'destek@estelongy.com',
      availableLanguage: ['Turkish'],
      areaServed: 'TR',
    },
  ],
  description: 'AI destekli klinik yönetim ve hasta takip platformu. Estelongy Gençlik Skoru ile longevity odaklı estetik sağlık.',
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Estelongy',
  alternateName: 'Estelongy Gençlik Skoru',
  url: SITE_URL,
  inLanguage: 'tr-TR',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/magaza?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
