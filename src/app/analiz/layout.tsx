import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EGS Analizi',
  description: 'Selfie yükleyerek biyolojik cilt yaşınızı ve EGS skorunuzu öğrenin.',
}

export default function AnalizLayout({ children }: { children: React.ReactNode }) {
  return children
}
