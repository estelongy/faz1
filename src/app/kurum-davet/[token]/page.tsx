export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import KurumDavetAkisi from './KurumDavetAkisi'

/**
 * Kurumsal referans anlaşması — kurumun gördüğü ekran.
 *
 * Kurum giriş yapmaz; linki açar, oranı görür, kabul veya reddeder.
 * Kabul edene kadar referansör pasiftir ve kod üretemez.
 */
export const metadata: Metadata = {
  title: 'Referans Anlaşması',
  robots: { index: false, follow: false },
}

export default async function KurumDavetPage({
  params,
}: { params: { token: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('referral_kurum_davet_oku', {
    p_token: params.token,
  })

  const davet = ((data ?? []) as Record<string, unknown>[])[0]

  if (!davet) {
    return (
      <main className="min-h-dvh bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-4xl mb-3">🔗</p>
          <h1 className="text-lg font-bold text-white">Davet bulunamadı</h1>
          <p className="text-sm text-slate-400 mt-2">
            Bağlantı hatalı olabilir. Daveti gönderen klinikle görüşün.
          </p>
        </div>
      </main>
    )
  }

  return (
    <KurumDavetAkisi
      token={params.token}
      kurumAd={String(davet.kurum_ad ?? '')}
      yetkili={(davet.kurum_yetkili as string) ?? null}
      havuz={Number(davet.havuz_oran ?? 0)}
      musteriMin={Number(davet.musteri_min ?? 15)}
      musteriMax={Number(davet.musteri_max ?? 20)}
      durum={String(davet.davet_durum ?? 'davet') as 'davet' | 'aktif' | 'red'}
    />
  )
}
