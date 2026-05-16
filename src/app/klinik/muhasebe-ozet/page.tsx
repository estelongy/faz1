export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, getMuhasebeOwnerProfile } from '@/lib/muhasebe-owner'
import OzetPrintClient from './OzetPrintClient'

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })
}

export default async function OzetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const ownerProfile = getMuhasebeOwnerProfile(user.id)

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const [patientsRes, treatmentsRes, productsRes, paymentsRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone'),
    supabase
      .from('internal_treatment')
      .select('id, patient_id, name, amount, treatment_date, notes')
      .gte('treatment_date', monthStart)
      .lte('treatment_date', todayStr)
      .order('treatment_date', { ascending: true }),
    supabase
      .from('internal_product')
      .select('id, treatment_id, name, quantity, unit'),
    supabase
      .from('internal_payment')
      .select('id, patient_id, treatment_id, amount, paid_at, method, notes')
      .gte('paid_at', monthStart)
      .lte('paid_at', todayStr)
      .order('paid_at', { ascending: true }),
  ])

  const patients   = patientsRes.data  ?? []
  const treatments = treatmentsRes.data ?? []
  const products   = productsRes.data  ?? []
  const payments   = paymentsRes.data  ?? []

  const patientName = (id: string) => patients.find(p => p.id === id)?.name ?? '—'

  const paymentsByTreatment = new Map<string, typeof payments>()
  const unmatchedPayments: typeof payments = []
  for (const p of payments) {
    if (p.treatment_id) {
      const arr = paymentsByTreatment.get(p.treatment_id) ?? []
      arr.push(p)
      paymentsByTreatment.set(p.treatment_id, arr)
    } else {
      unmatchedPayments.push(p)
    }
  }

  const treatmentRows = treatments.map(t => {
    const tProducts = products.filter(p => p.treatment_id === t.id)
    const tPayments = paymentsByTreatment.get(t.id) ?? []
    const billed    = Number(t.amount ?? 0)
    const collected = tPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
    return {
      date:         fmtDate(t.treatment_date),
      patient:      patientName(t.patient_id),
      name:         t.name,
      notes:        t.notes ?? '',
      products:     tProducts.map(p => `${p.name}${p.quantity ? ` × ${p.quantity}${p.unit ?? ''}` : ''}`),
      billed:       fmt(billed),
      collected:    collected > 0 ? fmt(collected) : '—',
      methods:      tPayments.map(p => p.method).filter(Boolean) as string[],
      remaining:    fmt(Math.max(0, billed - collected)),
      hasDebt:      billed > collected,
      billedRaw:    billed,
      collectedRaw: collected,
    }
  })

  const unmatchedRows = unmatchedPayments.map(p => ({
    date:    fmtDate(p.paid_at),
    patient: patientName(p.patient_id),
    amount:  fmt(Number(p.amount ?? 0)),
    method:  p.method ?? '—',
    notes:   p.notes ?? '',
  }))

  const totalBilled    = treatmentRows.reduce((s, r) => s + r.billedRaw, 0)
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const totalRemaining = totalBilled - totalCollected

  const startLabel = new Date(monthStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const todayLabel = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <OzetPrintClient
      ownerDisplayName={ownerProfile.displayName}
      ownerBrandLine={ownerProfile.brandLine ?? `${ownerProfile.displayName} — Klinik Muhasebe`}
      rangeLabel={`${startLabel} — ${todayLabel}`}
      generatedAt={now.toLocaleString('tr-TR')}
      totalBilled={fmt(totalBilled)}
      totalCollected={fmt(totalCollected)}
      totalRemaining={fmt(totalRemaining)}
      remainingIsPositive={totalRemaining > 0}
      treatmentRows={treatmentRows}
      unmatchedRows={unmatchedRows}
    />
  )
}
