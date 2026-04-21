import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Longevity Anketi',
  description: 'Yaşam tarzı bilgilerinizle Gençlik Skorunuzu artırın.',
}

export default function AnketLayout({ children }: { children: React.ReactNode }) {
  return children
}
