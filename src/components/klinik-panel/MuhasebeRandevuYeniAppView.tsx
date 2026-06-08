import YeniRandevuForm from '@/app/klinik/panel/muhasebe/randevu/yeni/YeniRandevuForm'
import type { DayAvailability } from '@/app/klinik/panel/muhasebe/randevu/slot-utils'

interface Props {
  initialDate?: string
  initialTime?: string
  week: DayAvailability[]
  doctorName: string
}

export default function MuhasebeRandevuYeniAppView({
  initialDate,
  initialTime,
  week,
  doctorName,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          Manuel randevu kaydı. Tekrarlayan seçilirse sistem ek randevuları otomatik üretir.
        </p>
      </header>
      <section className="px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <YeniRandevuForm
            initialDate={initialDate}
            initialTime={initialTime}
            week={week}
            doctorName={doctorName}
          />
        </div>
      </section>
    </div>
  )
}
