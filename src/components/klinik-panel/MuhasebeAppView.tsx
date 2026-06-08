import Link from 'next/link'
import { Plus, Clock, ChevronRight } from 'lucide-react'
import MuhasebeShellClient, {
  type DayGroup,
  type PatientRow,
  type CatalogItem,
  type AppointmentPrefill,
} from '@/app/klinik/panel/muhasebe/MuhasebeShellClient'
import RandevuListClient, {
  type AppointmentRow,
} from '@/app/klinik/panel/muhasebe/randevu/RandevuListClient'

interface Props {
  rows: PatientRow[]
  days: DayGroup[]
  catalog: CatalogItem[]
  monthLabel: string
  monthBilled: number
  monthCollected: number
  totalRemaining: number
  debtorCount: number
  patientCount: number
  prefill: AppointmentPrefill | null
  upcomingAppts: AppointmentRow[]
}

export default function MuhasebeAppView({
  rows,
  days,
  catalog,
  monthLabel,
  monthBilled,
  monthCollected,
  totalRemaining,
  debtorCount,
  patientCount,
  prefill,
  upcomingAppts,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          Günlük hareket — hasta bazlı işlem ve tahsilat takibi.
        </p>
      </header>

      {/* CTA — yeni randevu + müsaitlik */}
      <section className="px-5 grid grid-cols-2 gap-2.5">
        <Link
          href="/klinik/panel/muhasebe/randevu/yeni"
          className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-emerald-200 text-sm font-bold active:bg-emerald-500/20 transition"
        >
          <Plus size={16} /> Yeni Randevu
        </Link>
        <Link
          href="/klinik/panel/muhasebe/randevu/musaitlik"
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-slate-200 text-sm font-bold active:bg-slate-900 transition"
        >
          <Clock size={16} /> Müsaitlik
        </Link>
      </section>

      {/* Yaklaşan randevular */}
      {upcomingAppts.length > 0 && (
        <section className="px-5 mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Yaklaşan Randevular · {upcomingAppts.length}
            </p>
            <Link
              href="/klinik/panel/muhasebe/randevu"
              className="text-xs font-semibold text-emerald-300 active:text-emerald-200 flex items-center gap-0.5"
            >
              Tümü <ChevronRight size={14} />
            </Link>
          </div>
          <RandevuListClient rows={upcomingAppts} variant="compact" showFilters={false} />
        </section>
      )}

      {/* MuhasebeShell (içerik tablosu, hasta listesi, kayıt formu) */}
      <section className="px-5 mt-5">
        <MuhasebeShellClient
          rows={rows}
          days={days}
          catalog={catalog}
          monthLabel={monthLabel}
          monthBilled={monthBilled}
          monthCollected={monthCollected}
          totalRemaining={totalRemaining}
          debtorCount={debtorCount}
          patientCount={patientCount}
          prefill={prefill}
        />
      </section>
    </div>
  )
}
