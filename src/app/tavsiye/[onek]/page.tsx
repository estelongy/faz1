export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ReferansorPanel, { type PanelVerisi } from './ReferansorPanel'

export const metadata: Metadata = {
  title: 'Tavsiye Panelim',
  robots: { index: false, follow: false },
}

/**
 * Referansörün kendi paneli — ŞİFRESİZ.
 * Kodu (IG5GOK) bilen açar; veri `referral_panel` RPC'sinden gelir.
 * RPC SECURITY DEFINER olduğu için anonim istemci yalnızca kendi
 * önekinin verisini görebilir, tabloların tamamına erişemez.
 */
export default async function ReferansorSayfasi({
  params,
}: { params: { onek: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('referral_panel', { p_onek: params.onek })

  if (error || !data) notFound()
  const veri = data as PanelVerisi
  if (!veri.aktif) notFound()

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <ReferansorPanel veri={veri} />
      </div>
    </main>
  )
}
