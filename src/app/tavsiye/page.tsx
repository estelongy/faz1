export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import GirisFormu from './GirisFormu'

/**
 * Referansör giriş kapısı — önek bilinmeden.
 *
 * Panel adresi (/tavsiye/DH6GOK) unutulabilir; telefon unutulmaz.
 * Burada telefonla giriş yapılır, sistem kendi paneline yönlendirir.
 */
export const metadata: Metadata = {
  title: 'Referansör Girişi',
  robots: { index: false, follow: false },
}

export default function TavsiyeGirisSayfasi() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <GirisFormu />
      </div>
    </main>
  )
}
