import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Klinik Akışı',
}

export default function RandevuAkisLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
