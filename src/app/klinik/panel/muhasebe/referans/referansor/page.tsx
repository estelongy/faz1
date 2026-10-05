export const dynamic = 'force-dynamic'

// Referansörün gördüğü ekran — panel içinden, test amaçlı.
// Canlıda referansör kendi linkiyle /tavsiye/<önek> adresinden girer.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, clinicOwnerIdFor } from '@/lib/muhasebe-owner'
import MuhasebeNav from '../../MuhasebeNav'
import ReferansSayfaNav from '../ReferansSayfaNav'
import ReferansorPanel, { type PanelVerisi } from '@/app/tavsiye/[onek]/ReferansorPanel'

export const metadata: Metadata = {
  title: 'Referansör Görünümü | Klinik Yönetim',
  robots: { index: false, follow: false },
}

export default async function ReferansorOnizleme({
  searchParams,
}: { searchParams: { onek?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id

  const { data: ayar } = await supabase.from('referral_settings')
    .select('isletme_kodu').eq('owner_id', clinicOwner).maybeSingle()
  const isletme = ayar?.isletme_kodu ?? 'GOK'

  const { data: refler } = await supabase.from('referral_referrer')
    .select('id, patient_id, kod_harf, kod_rakam, aktif, internal_patient(name)')
    .eq('owner_id', clinicOwner)
    .eq('aktif', true)

  const liste = (refler ?? []).map((r: Record<string, unknown>) => {
    const p = (Array.isArray(r.internal_patient) ? r.internal_patient[0] : r.internal_patient) as { name?: string } | null
    return {
      onek: `${r.kod_harf}${r.kod_rakam}${isletme}`,
      ad: p?.name ?? '—',
    }
  })

  const secili = searchParams.onek ?? liste[0]?.onek ?? null
  const veri = secili
    ? ((await supabase.rpc('referral_panel', { p_onek: secili })).data as PanelVerisi | null)
    : null

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <MuhasebeNav title="Referansör Görünümü" />
        <ReferansSayfaNav aktif="referansor" />

        {/* Hangi referansörün ekranına bakılıyor */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {liste.length === 0 ? (
            <p className="text-sm text-slate-500">
              Henüz referansör yok.{' '}
              <Link href="/klinik/panel/muhasebe/referans" className="text-violet-300 underline">
                İşletme sayfasından ekleyin.
              </Link>
            </p>
          ) : liste.map(r => (
            <Link key={r.onek} href={`?onek=${r.onek}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                secili === r.onek
                  ? 'bg-emerald-500/25 text-emerald-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
              {r.ad} <span className="font-mono opacity-60">{r.onek}</span>
            </Link>
          ))}
        </div>

        {veri ? (
          <>
            <p className="text-[11px] text-slate-500 mb-2">
              Referansörün gördüğü ekran. Canlı adres:{' '}
              <span className="font-mono text-slate-400">/tavsiye/{veri.onek}</span>
            </p>
            <div className="rounded-2xl ring-1 ring-slate-800 bg-slate-950 p-4 max-w-md">
              <ReferansorPanel veri={veri} />
            </div>
          </>
        ) : liste.length > 0 ? (
          <p className="text-sm text-slate-500">Bu önek için veri bulunamadı.</p>
        ) : null}
      </div>
    </div>
  )
}
