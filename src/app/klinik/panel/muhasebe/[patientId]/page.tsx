export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import PatientDetailClient from './PatientDetailClient'
import { getServerFlavor } from '@/lib/server-flavor'
import MuhasebePatientAppView from '@/components/klinik-panel/MuhasebePatientAppView'

export const metadata: Metadata = {
  title: 'Hasta Detayı | Muhasebe',
  robots: { index: false, follow: false },
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  // Hasta + tüm ilişkili veriler
  const [patientRes, treatmentsRes, productsRes, paymentsRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone, notes').eq('id', patientId).maybeSingle(),
    supabase.from('internal_treatment').select('id, name, treatment_date, amount, notes').eq('patient_id', patientId).order('treatment_date', { ascending: false }),
    supabase.from('internal_product').select('id, treatment_id, name, quantity, unit, notes'),
    supabase.from('internal_payment').select('id, amount, paid_at, method, notes, treatment_id').eq('patient_id', patientId).order('paid_at', { ascending: false }),
  ])

  if (!patientRes.data) notFound()

  const patient = patientRes.data
  const treatments = treatmentsRes.data ?? []
  const products = productsRes.data ?? []
  const payments = paymentsRes.data ?? []

  // İşleme ürünleri bağla
  const treatmentsWithProducts = treatments.map(t => ({
    ...t,
    products: products.filter(p => p.treatment_id === t.id),
  }))

  const totalAmount = treatments.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const paidAmount = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const remaining = totalAmount - paidAmount

  const treatmentsMapped = treatmentsWithProducts.map(t => ({
    id: t.id,
    name: t.name,
    treatment_date: t.treatment_date,
    amount: Number(t.amount ?? 0),
    notes: t.notes,
    products: t.products.map(p => ({
      id: p.id,
      name: p.name,
      quantity: Number(p.quantity ?? 0),
      unit: p.unit,
      notes: p.notes,
    })),
  }))
  const paymentsMapped = payments.map(p => ({
    id: p.id,
    amount: Number(p.amount ?? 0),
    paid_at: p.paid_at,
    method: p.method,
    notes: p.notes,
    treatment_id: p.treatment_id,
  }))

  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    return (
      <MuhasebePatientAppView
        patient={{
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          notes: patient.notes,
        }}
        treatments={treatmentsMapped}
        payments={paymentsMapped}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        remaining={remaining}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
          <span>›</span>
          <Link href="/klinik/panel/muhasebe" className="hover:text-white transition-colors">Muhasebe</Link>
          <span>›</span>
          <span className="text-slate-300 truncate">{patient.name}</span>
        </nav>
        <h1 className="text-2xl font-black text-white">{patient.name}</h1>
        {patient.phone && <p className="text-slate-400 mt-0.5 text-sm">📞 {patient.phone}</p>}
        {patient.notes && (
          <p className="text-slate-500 mt-1 text-sm italic">{patient.notes}</p>
        )}
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard label="Toplam İşlem" value={formatTRY(totalAmount)} tone="neutral" />
        <SummaryCard label="Alınan" value={formatTRY(paidAmount)} tone="positive" />
        <SummaryCard
          label="Kalan"
          value={formatTRY(remaining)}
          tone={remaining > 0 ? 'warning' : remaining < 0 ? 'positive' : 'neutral'}
        />
      </div>

      <PatientDetailClient
        patientId={patientId}
        treatments={treatmentsMapped}
        payments={paymentsMapped}
      />
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
      <p className="text-sm uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-base sm:text-lg font-black mt-0.5">{value}</p>
    </div>
  )
}

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}
