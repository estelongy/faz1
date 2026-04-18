import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Kurumsal Giriş',
  description: 'Klinik veya satıcı hesabınızla Estelongy platformuna giriş yapın.',
}

export default function KurumsalGirisLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
