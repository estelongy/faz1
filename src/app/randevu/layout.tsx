import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Randevu Al',
  description: 'Estelongy\'deki onaylı kliniklerden randevu alın.',
}

export default function RandevuLayout({ children }: { children: React.ReactNode }) {
  return children
}
