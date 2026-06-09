import Link from 'next/link'
import { Users, Clock } from 'lucide-react'
import HastaSearchList from './HastaSearchList'

export type HastaItem = {
  userId: string
  fullName: string
  birthYear: number | null
  lastVisit: string | null
  totalAppts: number
  completed: number
  score: number | null
  isFinalScore: boolean
}

interface Props {
  clinicName: string
  hastalar: HastaItem[]
}

/**
 * EsteKlinikPRO app — /klinik/panel/hastalarim mobil görünümü.
 * Sticky arama input + hasta kartları liste; kart → /klinik/panel/hasta/[userId].
 */
export default function HastalarimAppView({ clinicName, hastalar }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/80">{clinicName}</p>
        <p className="mt-1 text-sm text-slate-400">
          <span className="text-white font-bold">{hastalar.length}</span> hasta kayıtlı
        </p>
      </header>

      {hastalar.length === 0 ? (
        <section className="px-5 mt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <Users size={32} className="mx-auto text-slate-600" />
            <p className="mt-2 text-white font-semibold">Henüz hasta yok</p>
            <p className="mt-1 text-sm text-slate-400">
              İlk randevu geldiğinde burada görünecek. Hasta gelmesi için önce müsaitlik saatlerinin tanımlı olması gerekiyor.
            </p>
            <Link
              href="/klinik/panel/musaitlik"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-sm font-bold active:bg-emerald-500/20 transition"
            >
              <Clock size={16} />
              Müsaitlik saatlerini aç
            </Link>
          </div>
        </section>
      ) : (
        <HastaSearchList hastalar={hastalar} />
      )}
    </div>
  )
}
