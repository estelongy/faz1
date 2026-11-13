export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adSoyadBasHarf } from '@/app/klinik/panel/muhasebe/referans-mesajlar'
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

export default async function ReferansorBasvuruSayfasi({
  searchParams,
}: { searchParams: { ref?: string } }) {
  const onek = searchParams.ref ?? ''

  // Davet eden referansörün adı sayfada geçsin: aday kimin çağırdığını
  // görünce mesajın gerçekliğinden emin oluyor. Soyadı baş harfe iner
  // (SMS'teki disiplinin aynısı). Önek yoksa/yanlışsa sayfa adsız açılır.
  let davetEden: string | null = null
  if (onek) {
    const supabase = await createClient()
    const { data } = await supabase.rpc('referral_panel', { p_onek: onek })
    const veri = data as { ad?: string; aktif?: boolean } | null
    if (veri?.aktif && veri.ad) davetEden = adSoyadBasHarf(veri.ad)
  }

  return <BasvuruFormu onek={onek} davetEden={davetEden} />
}
