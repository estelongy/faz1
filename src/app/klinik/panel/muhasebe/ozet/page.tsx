export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import OzetPrintClient from './OzetPrintClient'

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

export default async function OzetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const [patientsRes, treatmentsRes, paymentsRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone'),
    supabase
      .from('internal_treatment')
      .select('id, patient_id, name, amount, treatment_date')
      .gte('treatment_date', monthStart)
      .lte('treatment_date', todayStr)
      .order('treatment_date', { ascending: true }),
    supabase
      .from('internal_payment')
      .select('id, patient_id, amount, paid_at, method')
      .gte('paid_at', monthStart)
      .lte('paid_at', todayStr)
      .order('paid_at', { ascending: true }),
  ])

  const patients = patientsRes.data ?? []
  const treatments = treatmentsRes.data ?? []
  const payments = paymentsRes.data ?? []

  const patientName = (id: string) => patients.find(p => p.id === id)?.name ?? '—'

  // Günlük döküm
  const dayMap = new Map<string, {
    date: string
    treatments: { name: string; patientName: string; amount: number }[]
    payments: { patientName: string; amount: number; method: string | null }[]
    billed: number
    collected: number
  }>()

  for (const t of treatments) {
    let g = dayMap.get(t.treatment_date)
    if (!g) {
      g = { date: t.treatment_date, treatments: [], payments: [], billed: 0, collected: 0 }
      dayMap.set(t.treatment_date, g)
    }
    const amt = Number(t.amount ?? 0)
    g.treatments.push({ name: t.name, patientName: patientName(t.patient_id), amount: amt })
    g.billed += amt
  }
  for (const p of payments) {
    let g = dayMap.get(p.paid_at)
    if (!g) {
      g = { date: p.paid_at, treatments: [], payments: [], billed: 0, collected: 0 }
      dayMap.set(p.paid_at, g)
    }
    const amt = Number(p.amount ?? 0)
    g.payments.push({ patientName: patientName(p.patient_id), amount: amt, method: p.method })
    g.collected += amt
  }
  const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  // Hasta bazlı özet
  const patientMap = new Map<string, { name: string; billed: number; collected: number }>()
  for (const t of treatments) {
    let e = patientMap.get(t.patient_id)
    if (!e) { e = { name: patientName(t.patient_id), billed: 0, collected: 0 }; patientMap.set(t.patient_id, e) }
    e.billed += Number(t.amount ?? 0)
  }
  for (const p of payments) {
    let e = patientMap.get(p.patient_id)
    if (!e) { e = { name: patientName(p.patient_id), billed: 0, collected: 0 }; patientMap.set(p.patient_id, e) }
    e.collected += Number(p.amount ?? 0)
  }
  const patientRows = Array.from(patientMap.values()).sort((a, b) => b.billed - a.billed)

  const totalBilled = treatments.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const totalRemaining = totalBilled - totalCollected

  const startLabel = new Date(monthStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const todayLabel = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const rangeLabel = `${startLabel} — ${todayLabel}`

  return (
    <OzetPrintClient
      rangeLabel={rangeLabel}
      generatedAt={now.toLocaleString('tr-TR')}
      totalBilled={formatTRY(totalBilled)}
      totalCollected={formatTRY(totalCollected)}
      totalRemaining={formatTRY(totalRemaining)}
      remainingIsPositive={totalRemaining > 0}
      days={days.map(d => ({
        date: new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
        billed: formatTRY(d.billed),
        collected: formatTRY(d.collected),
        net: formatTRY(Math.abs(d.collected - d.billed)),
        netPositive: d.collected >= d.billed,
        treatments: d.treatments.map(t => ({ ...t, amount: formatTRY(t.amount) })),
        payments: d.payments.map(p => ({ ...p, amount: formatTRY(p.amount) })),
      }))}
      patientRows={patientRows.map(r => ({
        name: r.name,
        billed: formatTRY(r.billed),
        collected: formatTRY(r.collected),
        remaining: formatTRY(r.billed - r.collected),
        hasDebt: r.billed > r.collected,
      }))}
    />
  )
}
