export const dynamic = 'force-dynamic'

// Para yönetimi — hakediş ve ödemeler.
// referral_ledger yalnızca EKLENİR: satır silinmez, değiştirilmez.
// Bakiye ayrı alanda tutulmaz, her zaman satırlardan toplanır.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, clinicOwnerIdFor } from '@/lib/muhasebe-owner'
import MuhasebeNav from '../../MuhasebeNav'
import ReferansSayfaNav from '../ReferansSayfaNav'
import ParaPanel, { type ReferansorBakiye, type LedgerSatir } from './ParaPanel'

export const metadata: Metadata = {
  title: 'Referans Para | Klinik Yönetim',
  robots: { index: false, follow: false },
}

export default async function ReferansParaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id

  const [ayarRes, refRes, ledgerRes] = await Promise.all([
    supabase.from('referral_settings')
      .select('isletme_kodu').eq('owner_id', clinicOwner).maybeSingle(),
    supabase.from('referral_referrer')
      .select('id, kod_harf, kod_rakam, aktif, internal_patient(name, phone)')
      .eq('owner_id', clinicOwner),
    supabase.from('referral_ledger')
      .select('id, referrer_id, tur, tutar, aciklama, created_at')
      .eq('owner_id', clinicOwner)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const isletme = ayarRes.data?.isletme_kodu ?? 'GOK'
  const ledger = (ledgerRes.data ?? []).map(l => ({
    id: l.id, referrer_id: l.referrer_id, tur: l.tur as LedgerSatir['tur'],
    tutar: Number(l.tutar ?? 0), aciklama: l.aciklama,
    created_at: l.created_at,
  })) as LedgerSatir[]

  const referansorler = (refRes.data ?? []).map((r: Record<string, unknown>) => {
    const p = (Array.isArray(r.internal_patient) ? r.internal_patient[0] : r.internal_patient) as { name?: string; phone?: string } | null
    const kendi = ledger.filter(l => l.referrer_id === r.id)
    return {
      id: String(r.id),
      ad: p?.name ?? '—',
      tel: p?.phone ?? null,
      onek: `${r.kod_harf}${r.kod_rakam}${isletme}`,
      aktif: Boolean(r.aktif),
      hakedis: kendi.filter(l => l.tur === 'hakedis').reduce((s, l) => s + l.tutar, 0),
      odenen: -kendi.filter(l => l.tur === 'odeme').reduce((s, l) => s + l.tutar, 0),
      bakiye: kendi.reduce((s, l) => s + l.tutar, 0),
    }
  }) as ReferansorBakiye[]

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <MuhasebeNav title="Referans Para" />
        <ReferansSayfaNav aktif="para" />
        <ParaPanel referansorler={referansorler} ledger={ledger} />
      </div>
    </div>
  )
}
