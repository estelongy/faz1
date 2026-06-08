import MusaitlikForm from '@/app/klinik/panel/musaitlik/MusaitlikForm'

interface Props {
  clinicId: string
  clinicName: string
  availability: {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes: number
    is_active: boolean
  }[]
}

export default function MusaitlikAppView({ clinicId, clinicName, availability }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          {clinicName} — randevu kabul ettiğin gün ve saatler. Hastalar bu bilgilere göre rezervasyon yapar.
        </p>
      </header>
      <div className="px-5">
        <MusaitlikForm clinicId={clinicId} availability={availability} />
      </div>
    </div>
  )
}
