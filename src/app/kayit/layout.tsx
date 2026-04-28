import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kayıt Ol',
  description: 'Ücretsiz Estelongy hesabı oluşturun. Gençlik Skorunuzu keşfedin.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/kayit' },
}

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return children
}
