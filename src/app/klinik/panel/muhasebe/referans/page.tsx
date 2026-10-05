export const dynamic = 'force-dynamic'

// İşletme tarafı — teklifler, kodlar, referansörler, ayarlar.
// Kural motoru Postgres'te; bkz. docs ve referral_* migration'ları.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, clinicOwnerIdFor } from '@/lib/muhasebe-owner'
import MuhasebeNav from '../MuhasebeNav'
import ReferansPanel from '../ReferansPanel'
import ReferansSayfaNav from './ReferansSayfaNav'
import type { ReferansTeklif, ReferansorRow, ReferansKod } from '../referans-tipler'
import type { PatientRow } from '../MuhasebeShellClient'

export const metadata: Metadata = {
  title: 'Referans | Klinik Yönetim',
  robots: { index: false, follow: false },
}

export default async function ReferansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id

  const [patientsRes, setRes, offerRes, refRes, codeRes] = await Promise.all([
    supabase.from('internal_patient')
      .select('id, name, patient_code, phone')
      .eq('owner_id', clinicOwner)
      .order('name', { ascending: true }),
    supabase.from('referral_settings')
      .select('isletme_kodu, aktif, kod_omru_gun, aylik_limit')
      .eq('owner_id', clinicOwner).maybeSingle(),
    supabase.from('referral_offer')
      .select('id, baslik, ayricalik, aktif, kontenjan, gecerli_bitis, odul_tutar')
      .eq('owner_id', clinicOwner)
      .order('created_at', { ascending: false }),
    supabase.from('referral_referrer')
      .select('id, patient_id, kod_harf, kod_rakam, aktif')
      .eq('owner_id', clinicOwner),
    supabase.from('referral_code')
      .select('id, kod, durum, son_kullanma, created_at, referral_link!inner(referrer_id, kilitli_ad, kilitli_tel, offer_id), referral_visit(geldi)')
      .eq('owner_id', clinicOwner)
      .order('created_at', { ascending: false })
      .limit(300),
  ])

  // PatientRow'un tamamı burada gerekmiyor; panel yalnızca id/ad/kod kullanıyor.
  const patients = (patientsRes.data ?? []).map(p => ({
    id: p.id, name: p.name, patient_code: p.patient_code ?? null,
    phone: p.phone, notes: null,
    total_amount: 0, paid_amount: 0, remaining: 0,
    treatment_count: 0, last_activity: null,
  })) as unknown as PatientRow[]

  const kodlar = (codeRes.data ?? []).map((c: Record<string, unknown>) => {
    const link = (Array.isArray(c.referral_link) ? c.referral_link[0] : c.referral_link) as Record<string, unknown> | null
    const vis = (Array.isArray(c.referral_visit) ? c.referral_visit[0] : c.referral_visit) as Record<string, unknown> | null
    return {
      id: String(c.id), kod: String(c.kod), durum: String(c.durum),
      son_kullanma: String(c.son_kullanma), created_at: String(c.created_at),
      referrer_id: link ? String(link.referrer_id) : '',
      offer_id: link ? String(link.offer_id) : '',
      musteri_ad: (link?.kilitli_ad as string) ?? null,
      musteri_tel: (link?.kilitli_tel as string) ?? null,
      geldi: (vis?.geldi as boolean | null) ?? null,
    }
  }) as ReferansKod[]

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <MuhasebeNav title="Referans" />
        <ReferansSayfaNav aktif="isletme" />
        <ReferansPanel
          ayar={setRes.data ?? null}
          teklifler={(offerRes.data ?? []) as ReferansTeklif[]}
          referansorler={(refRes.data ?? []).map(r => ({
            id: r.id, patient_id: r.patient_id,
            onek: `${r.kod_harf}${r.kod_rakam}`, aktif: r.aktif,
          })) as ReferansorRow[]}
          kodlar={kodlar}
          patients={patients}
        />
      </div>
    </div>
  )
}
