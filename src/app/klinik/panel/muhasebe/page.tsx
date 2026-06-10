export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import MuhasebeShellClient, { type DayGroup, type PatientRow, type CatalogItem, type AppointmentPrefill } from './MuhasebeShellClient'
import RandevuListClient, { type AppointmentRow } from './randevu/RandevuListClient'
import { getServerFlavor } from '@/lib/server-flavor'
import MuhasebeAppView from '@/components/klinik-panel/MuhasebeAppView'

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

  // Yaklaşan randevular: bugünden itibaren 14 gün, planlı olanlar
  const nowIso = new Date().toISOString()
  const horizonIso = new Date(Date.now() + 14 * 86_400_000).toISOString()

  const [patientsRes, treatmentsRes, paymentsRes, catalogRes, upcomingRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone, notes').order('created_at', { ascending: false }),
    supabase.from('internal_treatment').select('id, patient_id, name, amount, treatment_date'),
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
      .eq('owner_id', user.id)
      .eq('status', 'scheduled')
      .gte('start_at', nowIso)
      .lte('start_at', horizonIso)
      .order('start_at', { ascending: true })
      .limit(20),
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
      .eq('owner_id', user.id)
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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
            <span>›</span>
            <span className="text-slate-300">Muhasebe</span>
          </nav>
          <h1 className="text-2xl font-black text-white">Muhasebe</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Günlük hareket — hasta bazlı işlem ve tahsilat takibi.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/klinik/panel/muhasebe/randevu/musaitlik"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Müsaitlik
          </Link>
          <Link
            href="/klinik/panel/muhasebe/randevu/yeni"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
            </svg>
            Yeni Randevu
          </Link>
        </div>
      </div>

      {/* Yaklaşan randevular paneli */}
      {upcomingAppts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <span>Yaklaşan Randevular</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {upcomingAppts.length}
              </span>
            </h2>
            <Link href="/klinik/panel/muhasebe/randevu" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              Tümünü gör →
            </Link>
          </div>
          <RandevuListClient rows={upcomingAppts} variant="compact" showFilters={false} />
        </div>
      )}

      <MuhasebeShellClient
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
      />
    </div>
  )
}
