import PatientDetailClient from '@/app/klinik/panel/muhasebe/[patientId]/PatientDetailClient'

interface Patient {
  id: string
  name: string
  phone: string | null
  notes: string | null
}

interface Treatment {
  id: string
  name: string
  treatment_date: string
  amount: number
  notes: string | null
  products: {
    id: string
    name: string
    quantity: number
    unit: string | null
    notes: string | null
  }[]
}

interface Payment {
  id: string
  amount: number
  paid_at: string
  method: string | null
  notes: string | null
  treatment_id: string | null
}

interface Props {
  patient: Patient
  treatments: Treatment[]
  payments: Payment[]
  totalAmount: number
  paidAmount: number
  remaining: number
}

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function MuhasebePatientAppView({
  patient,
  treatments,
  payments,
  totalAmount,
  paidAmount,
  remaining,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* Hasta başlığı */}
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xl font-black shrink-0">
          {patient.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base truncate">{patient.name}</p>
          {patient.phone && (
            <p className="text-xs text-slate-500 mt-0.5">📞 {patient.phone}</p>
          )}
        </div>
      </header>

      {patient.notes && (
        <section className="px-5 -mt-1 mb-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-2">
            <p className="text-xs text-slate-400 italic">{patient.notes}</p>
          </div>
        </section>
      )}

      {/* Özet 3x */}
      <section className="px-5 grid grid-cols-3 gap-2">
        <Stat label="Toplam" value={formatTRY(totalAmount)} accent="text-white" />
        <Stat label="Alınan" value={formatTRY(paidAmount)} accent="text-emerald-300" />
        <Stat
          label="Kalan"
          value={formatTRY(remaining)}
          accent={
            remaining > 0
              ? 'text-amber-300'
              : remaining < 0
              ? 'text-emerald-300'
              : 'text-slate-300'
          }
        />
      </section>

      <section className="px-5 mt-4">
        <PatientDetailClient
          patientId={patient.id}
          treatments={treatments}
          payments={payments}
        />
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}
