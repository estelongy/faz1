import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GateClient from './GateClient'

const VALID_TOKENS = new Set(['zamansiz-2026'])

export const metadata: Metadata = {
  title: 'Zamansız Güzellik Mimarlığı — Estelongy',
  description: 'Estelongy yatırımcı sunumu — özel erişim.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function SunumPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!VALID_TOKENS.has(token)) notFound()
  return <GateClient />
}
