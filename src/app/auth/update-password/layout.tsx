import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Şifre Güncelle',
  description: 'Hesabınız için yeni bir şifre belirleyin.',
}

export default function UpdatePasswordLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
