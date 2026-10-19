export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import BasvuruFormu from './BasvuruFormu'

/**
 * Referansör adayı başvuru sayfası — şifresiz.
 * Mevcut referansör linki paylaşır (?ref=ÖNEK), aday burada başvurur.
 * Klinik onaylayana kadar referansör oluşmaz.
 */
export const metadata: Metadata = {
  title: 'Referansör Başvurusu',
  robots: { index: false, follow: false },
}

export default function ReferansorBasvuruSayfasi({
  searchParams,
}: { searchParams: { ref?: string } }) {
  return <BasvuruFormu onek={searchParams.ref ?? ''} />
}
