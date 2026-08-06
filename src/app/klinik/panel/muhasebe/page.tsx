export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, clinicOwnerIdFor, getKlinikStaff } from '@/lib/muhasebe-owner'
import TekEkranKlinik, { type ApptRow, type TxRow, type PackageRow, type PromiseRow, type PhotoRow } from './TekEkranKlinik'
import { type DayGroup, type PatientRow, type CatalogItem, type AppointmentPrefill } from './MuhasebeShellClient'
import { type AppointmentRow } from './randevu/RandevuListClient'
import { getServerFlavor } from '@/lib/server-flavor'
import MuhasebeAppView from '@/components/klinik-panel/MuhasebeAppView'
import MuhasebeNav from './MuhasebeNav'

export const metadata: Metadata = {
  title: 'Muhasebe | Klinik Paneli',
  robots: { index: false, follow: false },
}

export default async function MuhasebePage({
  searchParams,
}: { searchParams: { from_appointment?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id

  // Yaklaşan randevular: bugünden itibaren 14 gün, planlı olanlar (app view için)
  const nowIso = new Date().toISOString()
  const horizonIso = new Date(Date.now() + 14 * 86_400_000).toISOString()
  // Tek ekran gün gezgini için geniş aralık: -30 / +90 gün, tüm durumlar
  const rangeStartIso = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const rangeEndIso = new Date(Date.now() + 90 * 86_400_000).toISOString()

  const [patientsRes, treatmentsRes, paymentsRes, catalogRes, upcomingRes, rangeRes, pkgApptsRes, promisesRes, photosRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone, notes').order('created_at', { ascending: false }),
    supabase.from('internal_treatment').select('id, patient_id, name, amount, treatment_date, session_total'),
    supabase.from('internal_payment').select('id, patient_id, amount, paid_at, method, treatment_id'),
    supabase
      .from('internal_treatment_catalog')
      .select('id, name, category, default_unit, default_price, egp_linked, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('internal_appointment')
      .select('id, patient_id, start_at, duration_minutes, appointment_type, treatment_type, reason, detail, status, recurrence_group_id')
      .eq('owner_id', clinicOwner)
      .eq('status', 'scheduled')
      .gte('start_at', nowIso)
      .lte('start_at', horizonIso)
      .order('start_at', { ascending: true })
      .limit(20),
    supabase
      .from('internal_appointment')
      .select('id, patient_id, start_at, duration_minutes, appointment_type, treatment_type, status, package_treatment_id')
      .eq('owner_id', clinicOwner)
      .gte('start_at', rangeStartIso)
      .lte('start_at', rangeEndIso)
      .order('start_at', { ascending: true }),
    // Paket sayaçları: pakete bağlı TÜM randevular (pencere dışındakiler dahil)
    supabase
      .from('internal_appointment')
      .select('package_treatment_id, status, start_at')
      .eq('owner_id', clinicOwner)
      .not('package_treatment_id', 'is', null),
    // Açık ödeme sözleri (alacak takibi)
    supabase
      .from('internal_payment_promise')
      .select('id, patient_id, due_date, amount, note, status')
      .eq('owner_id', clinicOwner)
      .eq('status', 'open')
      .order('due_date', { ascending: true }),
    // Hasta fotoğrafları (meta — imzalı URL aşağıda üretilir)
    supabase
      .from('internal_patient_photo')
      .select('id, patient_id, treatment_id, storage_path, note, created_at')
      .eq('owner_id', clinicOwner)
      .order('created_at', { ascending: false }),
  ])

  const patients = patientsRes.data ?? []
  const treatments = treatmentsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const catalog = catalogRes.data ?? []
  const patientName = (id: string) => patients.find(p => p.id === id)?.name ?? '—'
  const patientPhone = (id: string) => patients.find(p => p.id === id)?.phone ?? null

  const upcomingAppts: AppointmentRow[] = (upcomingRes.data ?? []).map(a => ({
    id: a.id,
    patient_id: a.patient_id,
    patient_name: patientName(a.patient_id),
    patient_phone: patientPhone(a.patient_id),
    start_at: a.start_at,
    duration_minutes: a.duration_minutes,
    appointment_type: a.appointment_type,
    treatment_type: a.treatment_type,
    reason: a.reason,
    detail: a.detail,
    status: a.status,
    recurrence_group_id: a.recurrence_group_id,
  }))

  // ─── İşleme alınan randevu varsa hızlı kayıt prefill'ini hazırla ────
  let prefill: AppointmentPrefill | null = null
  const fromApptId = typeof searchParams.from_appointment === 'string' ? searchParams.from_appointment : null
  if (fromApptId) {
    const { data: appt } = await supabase
      .from('internal_appointment')
      .select('id, patient_id, start_at, treatment_type, status')
      .eq('id', fromApptId)
      .eq('owner_id', clinicOwner)
      .maybeSingle()
    if (appt && appt.status !== 'completed') {
      const p = patients.find(pp => pp.id === appt.patient_id)
      prefill = {
        appointmentId: appt.id,
        patientId: p?.id ?? null,
        patientName: p?.name ?? '',
        patientPhone: p?.phone ?? null,
        treatmentName: appt.treatment_type ?? '',
        treatmentDate: new Date(appt.start_at).toISOString().slice(0, 10),
      }
    }
  }

  // ─── Hasta satırları ────────────────────────────────────────
  const rows: PatientRow[] = patients.map(p => {
    const ts = treatments.filter(t => t.patient_id === p.id)
    const ps = payments.filter(pay => pay.patient_id === p.id)
    const totalAmount = ts.reduce((s, t) => s + Number(t.amount ?? 0), 0)
    const paidAmount = ps.reduce((s, pay) => s + Number(pay.amount ?? 0), 0)
    const lastT = ts.map(t => t.treatment_date).sort().pop()
    const lastP = ps.map(pay => pay.paid_at).sort().pop()
    const lastActivity = [lastT, lastP].filter(Boolean).sort().pop() ?? null
    return {
      id: p.id, name: p.name, phone: p.phone, notes: p.notes,
      total_amount: totalAmount, paid_amount: paidAmount,
      remaining: totalAmount - paidAmount,
      treatment_count: ts.length, last_activity: lastActivity,
    }
  })

  // ─── Bu ay yekün ────────────────────────────────────────────
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthLabel = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  const monthBilled = treatments
    .filter(t => t.treatment_date >= monthStart)
    .reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const monthCollected = payments
    .filter(p => p.paid_at >= monthStart)
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)

  // Tüm zaman kalan (genel borç durumu — ay yekünü değil)
  const totalAll = rows.reduce((s, r) => s + r.total_amount, 0)
  const paidAll = rows.reduce((s, r) => s + r.paid_amount, 0)
  const remainingAll = totalAll - paidAll
  const debtorCount = rows.filter(r => r.remaining > 0).length

  // ─── Günlük hareket dökümü (son 365 gün — geçmiş ay seçici için) ─
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365).toISOString().slice(0, 10)
  const dayMap = new Map<string, DayGroup>()
  function ensureDay(d: string): DayGroup {
    let g = dayMap.get(d)
    if (!g) {
      g = { date: d, treatments: [], payments: [], billed: 0, collected: 0 }
      dayMap.set(d, g)
    }
    return g
  }
  for (const t of treatments) {
    if (t.treatment_date < cutoff) continue
    const g = ensureDay(t.treatment_date)
    const amt = Number(t.amount ?? 0)
    g.treatments.push({
      id: t.id,
      patient_id: t.patient_id,
      patient_name: patientName(t.patient_id),
      name: t.name,
      amount: amt,
    })
    g.billed += amt
  }
  for (const p of payments) {
    if (p.paid_at < cutoff) continue
    const g = ensureDay(p.paid_at)
    const amt = Number(p.amount ?? 0)
    g.payments.push({
      id: p.id,
      patient_id: p.patient_id,
      patient_name: patientName(p.patient_id),
      amount: amt,
      method: p.method,
    })
    g.collected += amt
  }
  const days: DayGroup[] = Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date))

  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    return (
      <MuhasebeAppView
        rows={rows}
        days={days}
        catalog={catalog as CatalogItem[]}
        monthLabel={monthLabel}
        monthBilled={monthBilled}
        monthCollected={monthCollected}
        totalRemaining={remainingAll}
        debtorCount={debtorCount}
        patientCount={rows.length}
        prefill={prefill}
        upcomingAppts={upcomingAppts}
      />
    )
  }

  // ─── Tek ekran veri hazırlığı ───────────────────────────────
  const staff = getKlinikStaff(user.id)!
  const rangeAppts: ApptRow[] = (rangeRes.data ?? []).map(a => ({
    id: a.id,
    patient_id: a.patient_id,
    start_at: a.start_at,
    duration_minutes: a.duration_minutes,
    appointment_type: a.appointment_type,
    treatment_type: a.treatment_type,
    status: a.status,
    package_treatment_id: a.package_treatment_id ?? null,
  }))

  // ─── Paket sayaçları ────────────────────────────────────────
  const pkgAppts = pkgApptsRes.data ?? []
  const nowMs = Date.now()
  const packages: PackageRow[] = treatments
    .filter(t => (t.session_total ?? 0) > 1)
    .map(t => {
      const linked = pkgAppts.filter(a => a.package_treatment_id === t.id)
      const done = linked.filter(a => a.status === 'completed').length
      const nextAt = linked
        .filter(a => a.status === 'scheduled' && new Date(a.start_at).getTime() >= nowMs)
        .map(a => a.start_at)
        .sort()[0] ?? null
      return {
        treatment_id: t.id,
        patient_id: t.patient_id,
        name: t.name,
        session_total: t.session_total as number,
        done,
        planned: linked.filter(a => a.status === 'scheduled').length,
        next_at: nextAt,
      }
    })
  const txs: TxRow[] = [
    ...treatments.map(t => ({
      id: t.id, patient_id: t.patient_id, kind: 'islem' as const,
      date: t.treatment_date, label: t.name, amount: Number(t.amount ?? 0),
    })),
    ...payments.map(p => ({
      id: p.id, patient_id: p.patient_id, kind: 'tahsilat' as const,
      date: p.paid_at, label: p.method ?? '', amount: Number(p.amount ?? 0),
    })),
  ]

  // ─── Foto imzalı URL'ler (1 saat geçerli) ───────────────────
  const photoRows = photosRes.data ?? []
  let photos: PhotoRow[] = []
  if (photoRows.length > 0) {
    const { data: signed } = await supabase.storage
      .from('klinik-foto')
      .createSignedUrls(photoRows.map(p => p.storage_path), 3600)
    const urlByPath = new Map((signed ?? []).map(s => [s.path, s.signedUrl]))
    photos = photoRows
      .map(p => ({
        id: p.id,
        patient_id: p.patient_id,
        treatment_id: p.treatment_id,
        note: p.note,
        created_at: p.created_at,
        url: urlByPath.get(p.storage_path) ?? '',
      }))
      .filter(p => p.url)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <MuhasebeNav title="Klinik Yönetim" showHome={false} />

      <TekEkranKlinik
        role={staff.role}
        displayName={staff.displayName}
        patients={rows}
        appointments={rangeAppts}
        txs={txs}
        catalog={catalog as CatalogItem[]}
        packages={packages}
        promises={(promisesRes.data ?? []) as PromiseRow[]}
        photos={photos}
      />
    </div>
  )
}
