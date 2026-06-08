import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ScoreBar, { type ScorePhase } from '@/components/ScoreBar'
import ScoreChart, { type ScorePoint } from '@/components/ScoreChart'
import KlinikNotlar, { type ClinicNote } from '@/app/klinik/panel/hasta/[userId]/KlinikNotlar'
import ZiyaretKarti, { type ZiyaretItem } from '@/components/ZiyaretKarti'
import VitrinePaylasimSection from '@/app/klinik/panel/hasta/[userId]/VitrinePaylasimSection'
import { saveVisitNotesAction } from '@/app/klinik/panel/hasta/[userId]/ziyaret-actions'

interface Props {
  userId: string
  profileName: string
  profileCreatedAt: string | null
  totalAppts: number
  latestScore: number | null
  scorePhase: ScorePhase
  chartPoints: ScorePoint[]
  activeApptId: string | null
  activeApptStatus: string | null
  notes: ClinicNote[]
  timeline: ZiyaretItem[]
  vitrineAnalyses: Parameters<typeof VitrinePaylasimSection>[0]['analyses']
}

/**
 * EsteKlinikPRO mobil hasta detayı.
 * NativeTopBar başlık gösterir → h1 yok, breadcrumb yok.
 */
export default function HastaDetayAppView({
  userId,
  profileName,
  profileCreatedAt,
  totalAppts,
  latestScore,
  scorePhase,
  chartPoints,
  activeApptId,
  activeApptStatus,
  notes,
  timeline,
  vitrineAnalyses,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* Hasta başlığı (avatar + meta) */}
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xl font-black shrink-0">
          {(profileName ?? '?')[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base truncate">{profileName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {profileCreatedAt
              ? `Üyelik ${new Date(profileCreatedAt).toLocaleDateString('tr-TR')}`
              : '—'}
            {' · '}
            {totalAppts} randevu
          </p>
        </div>
      </header>

      {/* Aktif randevu CTA */}
      {activeApptId && (
        <div className="px-5 mb-4">
          <Link
            href={`/klinik/panel/randevu/${activeApptId}`}
            className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 active:bg-emerald-500/20 transition"
          >
            <span className="text-emerald-200 text-sm font-bold">
              {activeApptStatus === 'in_progress'
                ? 'Klinik Akışına Devam Et'
                : 'Klinik Sürecini Başlat'}
            </span>
            <ChevronRight size={18} className="text-emerald-300" />
          </Link>
        </div>
      )}

      {/* EGS */}
      <section className="px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          {latestScore != null ? (
            <ScoreBar score={latestScore} phase={scorePhase} animated={false} isClinicView />
          ) : (
            <div className="py-6 text-center">
              <p className="text-slate-400 text-sm font-medium">Estelongy Gençlik Skoru yok</p>
              <p className="text-slate-600 text-xs mt-1">Hasta henüz analiz yapmamış</p>
            </div>
          )}
        </div>
      </section>

      {/* Skor geçmişi */}
      {chartPoints.length > 0 && (
        <section className="px-5 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
            Skor Geçmişi
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <ScoreChart points={chartPoints} />
          </div>
        </section>
      )}

      {/* Klinik notları */}
      <section className="px-5 mt-4">
        <KlinikNotlar userId={userId} notes={notes} />
      </section>

      {/* Vitrine paylaşımı */}
      {vitrineAnalyses.length > 0 && (
        <section className="px-5 mt-4">
          <VitrinePaylasimSection userId={userId} analyses={vitrineAnalyses} />
        </section>
      )}

      {/* Ziyaret zaman çizelgesi */}
      <section className="px-5 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
          Ziyaret & Analiz ({timeline.length})
        </p>
        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((item) => (
              <ZiyaretKarti
                key={`${item.kind}-${item.id}`}
                item={item}
                editable={item.kind === 'visit'}
                klinikAkisLink
                saveVisitNotes={saveVisitNotesAction}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500 text-sm">
            Henüz ziyaret veya analiz yok
          </div>
        )}
      </section>
    </div>
  )
}
