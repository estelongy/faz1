import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'Estelongy hesabınıza giriş yapın.',
}

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return children
}
