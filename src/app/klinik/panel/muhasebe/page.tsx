export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import MuhasebeListClient from './MuhasebeListClient'

export const metadata: Metadata = {
  title: 'Muhasebe | Klinik Paneli',
  robots: { index: false, follow: false },
}

interface PatientRow {
  id: string
  name: string
  phone: string | null
  notes: string | null
  total_amount: number  // SUM treatments.amount
  paid_amount: number   // SUM payments.amount
  remaining: number
  treatment_count: number
  last_activity: string | null  // en son işlem veya tahsilat tarihi
}

export default async function MuhasebePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  // Tüm hasta + işlem + tahsilat verilerini çek, JS'te birleştir
  const [patientsRes, treatmentsRes, paymentsRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone, notes').order('created_at', { ascending: false }),
    supabase.from('internal_treatment').select('id, patient_id, amount, treatment_date'),
    supabase.from('internal_payment').select('id, patient_id, amount, paid_at'),
  ])

  const patients = patientsRes.data ?? []
  const treatments = treatmentsRes.data ?? []
  const payments = paymentsRes.data ?? []

  const rows: PatientRow[] = patients.map(p => {
    const ts = treatments.filter(t => t.patient_id === p.id)
    const ps = payments.filter(pay => pay.patient_id === p.id)
    const totalAmount = ts.reduce((s, t) => s + Number(t.amount ?? 0), 0)
    const paidAmount = ps.reduce((s, pay) => s + Number(pay.amount ?? 0), 0)
    const lastT = ts.map(t => t.treatment_date).sort().pop()
    const lastP = ps.map(pay => pay.paid_at).sort().pop()
    const lastActivity = [lastT, lastP].filter(Boolean).sort().pop() ?? null
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      notes: p.notes,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      remaining: totalAmount - paidAmount,
      treatment_count: ts.length,
      last_activity: lastActivity,
    }
  })

  // Toplam özet
  const totalAll = rows.reduce((s, r) => s + r.total_amount, 0)
  const paidAll = rows.reduce((s, r) => s + r.paid_amount, 0)
  const remainingAll = totalAll - paidAll
  const debtorCount = rows.filter(r => r.remaining > 0).length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
          <span>›</span>
          <span className="text-slate-300">Muhasebe</span>
        </nav>
        <h1 className="text-2xl font-black text-white">Muhasebe</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Hasta bazlı işlem ve tahsilat takibi.</p>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Hasta Sayısı" value={rows.length.toString()} tone="neutral" />
        <SummaryCard label="Toplam İşlem" value={`${formatTRY(totalAll)}`} tone="neutral" />
        <SummaryCard label="Toplam Alınan" value={`${formatTRY(paidAll)}`} tone="positive" />
        <SummaryCard
          label={`Kalan${debtorCount > 0 ? ` (${debtorCount} hasta)` : ''}`}
          value={`${formatTRY(remainingAll)}`}
          tone={remainingAll > 0 ? 'warning' : 'positive'}
        />
      </div>

      <MuhasebeListClient initialRows={rows} />
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'positive' | 'warning' }) {
  const colors =
    tone === 'positive' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' :
    tone === 'warning' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' :
    'text-slate-200 border-slate-700 bg-slate-800/50'
  return (
    <div className={`rounded-xl p-3 border ${colors}`}>
      <p className="text-[10px] uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-lg font-black mt-0.5">{value}</p>
    </div>
  )
}

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}
