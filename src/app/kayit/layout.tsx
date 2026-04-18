import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kayıt Ol',
  description: 'Ücretsiz Estelongy hesabı oluşturun. EGS skorunuzu keşfedin.',
}

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return children
}
