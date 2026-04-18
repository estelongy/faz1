import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Longevity Anketi',
  description: 'Yaşam tarzı bilgilerinizle EGS skorunuzu artırın.',
}

export default function AnketLayout({ children }: { children: React.ReactNode }) {
  return children
}
