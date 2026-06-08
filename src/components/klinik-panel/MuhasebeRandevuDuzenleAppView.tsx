import RandevuEditForm from '@/app/klinik/panel/muhasebe/randevu/[id]/duzenle/RandevuEditForm'
import type { DayAvailability } from '@/app/klinik/panel/muhasebe/randevu/slot-utils'

interface Props {
  appointment: Parameters<typeof RandevuEditForm>[0]['appointment']
  week: DayAvailability[]
  patientName: string | null
  patientPhone: string | null
  isRecurring: boolean
}

export default function MuhasebeRandevuDuzenleAppView({
  appointment,
  week,
  patientName,
  patientPhone,
  isRecurring,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-300 font-semibold">
          {patientName ?? '—'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {patientPhone ?? ''}
          {isRecurring && (
            <span className="ml-2 text-emerald-300">↻ tekrarlayan serinin parçası</span>
          )}
        </p>
      </header>
      <section className="px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <RandevuEditForm appointment={appointment} week={week} />
        </div>
      </section>
    </div>
  )
}
