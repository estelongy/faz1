export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import MuhasebeShellClient, { type DayGroup, type PatientRow, type CatalogItem } from './MuhasebeShellClient'

export const metadata: Metadata = {
  title: 'Muhasebe | Klinik Paneli',
  robots: { index: false, follow: false },
}

export default async function MuhasebePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  const [patientsRes, treatmentsRes, paymentsRes, catalogRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone, notes').order('created_at', { ascending: false }),
    supabase.from('internal_treatment').select('id, patient_id, name, amount, treatment_date'),
    supabase.from('internal_payment').select('id, patient_id, amount, paid_at, method, treatment_id'),
    supabase
      .from('internal_treatment_catalog')
      .select('id, name, category, default_unit, default_price, egp_linked, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ])

  const patients = patientsRes.data ?? []
  const treatments = treatmentsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const catalog = catalogRes.data ?? []
  const patientName = (id: string) => patients.find(p => p.id === id)?.name ?? '—'

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

  // ─── Günlük hareket dökümü (son 90 gün) ─────────────────────
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString().slice(0, 10)
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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
          <span>›</span>
          <span className="text-slate-300">Muhasebe</span>
        </nav>
        <h1 className="text-2xl font-black text-white">Muhasebe</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Günlük hareket — hasta bazlı işlem ve tahsilat takibi.</p>
      </div>

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
      />
    </div>
  )
}
