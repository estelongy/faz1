import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'Estelongy hesabınıza giriş yapın.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/giris' },
}

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return children
}
