import MusaitlikForm from '@/app/klinik/panel/muhasebe/randevu/musaitlik/MusaitlikForm'
import type { DayAvailability } from '@/app/klinik/panel/muhasebe/randevu/slot-utils'

interface Props {
  week: DayAvailability[]
  doctorName: string
}

export default function MuhasebeMusaitlikAppView({ week, doctorName }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          {doctorName} — Özel pratik için hangi günler ve saatlerde randevu kabul ettiğini belirle.
          Marketplace klinik müsaitliğinden bağımsız çalışır.
        </p>
      </header>
      <section className="px-5">
        <MusaitlikForm week={week} />
      </section>
    </div>
  )
}
