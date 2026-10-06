export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DavetAkisi, { type DavetVerisi } from './DavetAkisi'

export const metadata: Metadata = {
  title: 'Size Özel Teklif',
  robots: { index: false, follow: false },
}

/**
 * Müşterinin açtığı davet sayfası — şifresiz.
 *
 * Link BOŞ gelir; kimin kullanacağı belli değildir. Müşteri numarasını
 * kendi girip SMS ile doğrulayınca link ona kilitlenir ve kodu üretilir.
 *
 * Veri doğrudan tablodan okunmaz: müşteri anonimdir, RLS politikaları
 * owner_id = my_clinic_owner() ister. Tek bir SECURITY DEFINER fonksiyonu
 * yalnızca görünmesi gereken alanları döndürür — indirim kodu asla.
 */
export default async function DavetSayfasi({
  params,
}: { params: { token: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('referral_davet_goster', { p_token: params.token })

  const d = (data ?? null) as Record<string, unknown> | null

  const veri: DavetVerisi = {
    token: params.token,
    gecerli: Boolean(d?.gecerli),
    kilitli: Boolean(d?.kilitli),
    referansor: (d?.referansor as string) ?? null,
    baslik: (d?.baslik as string) ?? '',
    ayricalik: (d?.ayricalik as string) ?? '',
    tur: (d?.tur as string) ?? 'genel',
    gecerliZaman: (d?.gecerli_zaman as string) ?? null,
    gorselIzni: Boolean(d?.gorsel_izni),
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8">
      <div className="mx-auto w-full max-w-sm">
        <DavetAkisi veri={veri} />
      </div>
    </main>
  )
}
