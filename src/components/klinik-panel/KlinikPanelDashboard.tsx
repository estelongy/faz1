import Link from 'next/link'
import TercihliKartlarSection from './TercihliKartlarSection'
import AkreditasyonKart from './AkreditasyonKart'
import OnboardingBanner from './OnboardingBanner'
import BugununAkisiCard, { type ApptView } from './BugununAkisiCard'
import type { Accreditation } from '@/lib/clinic-accreditation'
import type { OnboardingStatus } from '@/lib/clinic-onboarding'
import type { PostsByCategory } from '@/lib/editorial-posts'
import { type SharedCaseWithProfile, formatAnonymousName, calculateDelta } from '@/lib/shared-cases'

interface UretimMetrics {
  thisMonthCount: number
  monthDelta: number
  acceptanceRate: number
  klinikOnayiSayisi: number
}

interface Props {
  hekimName: string | null
  clinicName: string
  todayAppts: ApptView[]
  tomorrowApptsCount: number
  pendingAppts: ApptView[]
  inProgressAppts: ApptView[]
  uretimMetrics: UretimMetrics
  totalCredit: number
  accreditation: Accreditation
  onboarding: OnboardingStatus
  postsByCategory: PostsByCategory
  approvedCases: SharedCaseWithProfile[]
  onConfirmAppointment: (apptId: string) => Promise<{ ok: boolean; error?: string }>
  onRejectAppointment: (apptId: string) => Promise<{ ok: boolean; error?: string }>
}

export default function KlinikPanelDashboard({
  hekimName, clinicName, todayAppts, tomorrowApptsCount, pendingAppts, inProgressAppts,
  uretimMetrics, totalCredit, accreditation, onboarding, postsByCategory, approvedCases,
  onConfirmAppointment, onRejectAppointment,
}: Props) {
  const greeting = getGreeting()
  const firstName = hekimName?.split(' ')[0] ?? 'Hekim'

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ─── Karşılama Satırı ─────────────────────────────────────── */}
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {greeting}, <span className="text-violet-300">Dr. {firstName}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{clinicName}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Faz rozeti — gerçek akreditasyon */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
            accreditation.phase === 0 ? 'bg-slate-700/30 border-slate-600 text-slate-400' :
            accreditation.phase === 1 ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' :
            accreditation.phase === 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/></svg>
            {accreditation.phase === 0 ? 'Yeni Klinik' : `Faz ${accreditation.phase} — ${accreditation.phaseLabel}`}
          </div>
          <Link href="/klinik/panel/kredi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:opacity-80 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {totalCredit} Kredi
          </Link>
          <Link href="/estestore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold hover:bg-violet-500/20 transition-colors">
            <span>🛒</span>
            EsteStore
          </Link>
        </div>
      </header>

      {/* ─── EsteStore Geniş Kart — klinik için pazaryeri girişi ───── */}
      <Link
        href="/estestore"
        className="group block relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-violet-500/10 hover:border-violet-400/60 transition-all p-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-2xl shrink-0">
            🛒
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm sm:text-base">
              <span className="text-violet-300">EsteStore</span> — Klinikler için pazaryeri
            </p>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Kozmetik, sarf & medikal ve akademik eğitim paketleri tek çatıda. Profesyonel fiyat ve toplu alım baremi.
            </p>
          </div>
          <svg className="w-5 h-5 text-violet-300 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* ─── ONBOARDING BANNER — sadece tamamlanmamış adım varsa ─── */}
      <OnboardingBanner onboarding={onboarding} />

      {/* ─── KATMAN 1 — ŞİMDİ ─────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-2 px-1">Şimdi</p>
        <BugununAkisiCard
          todayAppts={todayAppts}
          tomorrowApptsCount={tomorrowApptsCount}
          pendingAppts={pendingAppts}
          inProgressAppts={inProgressAppts}
          onConfirm={onConfirmAppointment}
          onReject={onRejectAppointment}
        />
      </section>

      {/* ─── KATMAN 2 — BU AY ─────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-2 px-1">Bu Ay</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <UretiminCard metrics={uretimMetrics} />
          <AkreditasyonKart accreditation={accreditation} />
          <SonucVitriniCard cases={approvedCases} />
        </div>
      </section>

      {/* ─── KATMAN 3 — UZUN VADE (TERCİHLİ) ──────────────────────── */}
      <TercihliKartlarSection postsByCategory={postsByCategory} />
    </div>
  )

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 6)  return 'İyi geceler'
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi günler'
    return 'İyi akşamlar'
  }
}

// ───────────────────────────────────────────────────────────────────
// SABİT KARTLAR (BugununAkisiCard ayrı dosyaya taşındı — client interaktif)
// ───────────────────────────────────────────────────────────────────

function UretiminCard({ metrics }: { metrics: UretimMetrics }) {
  const { thisMonthCount, monthDelta, acceptanceRate, klinikOnayiSayisi } = metrics
  const deltaSign = monthDelta > 0 ? '+' : monthDelta < 0 ? '' : '±'
  const deltaColor = monthDelta > 0 ? 'text-emerald-400' : monthDelta < 0 ? 'text-amber-400' : 'text-slate-500'

  return (
    <Link
      href="/klinik/panel/rapor"
      className="block group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 hover:border-emerald-500/40 transition-all p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-bold">Üretimin</h3>
          <p className="text-slate-500 text-xs mt-0.5">Bu ay</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Yönlendirilen"
          value={thisMonthCount}
          extra={<span className={`text-xs font-semibold ${deltaColor}`}>{deltaSign}{Math.abs(monthDelta)}</span>}
        />
        <Metric label="Kabul oranı" value={`${acceptanceRate}%`} />
        <Metric label="Klinik onayı" value={klinikOnayiSayisi} />
        <Metric label="Skoru artan" value="—" subtle />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
        <span className="text-slate-500">Detaylı rapor</span>
        <span className="text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </div>
    </Link>
  )
}

function SonucVitriniCard({ cases }: { cases: SharedCaseWithProfile[] }) {
  // Onaylı vakalardan en yüksek Δ olanı seç
  const sortedByDelta = [...cases].sort((a, b) => {
    const da = calculateDelta(a.initial_score, a.final_score) ?? -Infinity
    const db = calculateDelta(b.initial_score, b.final_score) ?? -Infinity
    return db - da
  })
  const topCase = sortedByDelta[0]
  const delta = topCase ? calculateDelta(topCase.initial_score, topCase.final_score) : null

  if (!topCase) {
    // Boş state — vaka yok
    return (
      <div className="block group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Sonuç Vitrini</h3>
            <p className="text-slate-500 text-xs mt-0.5">En iyi vakaların</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/>
            </svg>
          </div>
        </div>

        <div className="py-4 text-center">
          <div className="text-4xl mb-2 opacity-40">✦</div>
          <p className="text-slate-400 text-sm font-medium mb-1">Vitrinin boş</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Hasta detayında &quot;Paylaşım izni iste&quot; butonuyla en iyi vakalarını burada sergileyebilirsin.
          </p>
        </div>
      </div>
    )
  }

  const anonName = formatAnonymousName(topCase.patient_full_name, topCase.anonymity_level)
  const ageGenderLine = [
    topCase.patient_age != null ? `${topCase.patient_age} yaş` : null,
    topCase.patient_gender,
  ].filter(Boolean).join(' · ')

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-bold">Sonuç Vitrini</h3>
          <p className="text-slate-500 text-xs mt-0.5">{cases.length} onaylı vaka</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/>
          </svg>
        </div>
      </div>

      {/* Top vaka */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-amber-300/80">
          <span>🏆</span>
          <span className="font-bold uppercase tracking-wider">Bu ayın en yüksek Δ</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-white font-bold text-base">{anonName}</span>
          {ageGenderLine && <span className="text-slate-500 text-xs">{ageGenderLine}</span>}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-slate-600 text-[10px] uppercase tracking-wider">Ön</p>
            <p className="text-slate-400 text-2xl font-bold">{topCase.initial_score ?? '—'}</p>
          </div>
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h15" />
          </svg>
          <div className="text-center">
            <p className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Klinik Onaylı</p>
            <p className="text-emerald-400 text-2xl font-black">{topCase.final_score ?? '—'}</p>
          </div>
          {delta != null && delta > 0 && (
            <div className="ml-auto px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <span className="text-emerald-300 font-black text-sm">+{delta}</span>
              <span className="text-emerald-400/70 text-[10px] ml-1">puan</span>
            </div>
          )}
        </div>
      </div>

      {cases.length > 1 && (
        <p className="mt-4 pt-3 border-t border-slate-700/30 text-xs text-slate-500 text-center">
          + {cases.length - 1} vaka daha vitrinde
        </p>
      )}
    </div>
  )
}

function Metric({ label, value, extra, subtle }: { label: string; value: number | string; extra?: React.ReactNode; subtle?: boolean }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className={`text-xl font-black ${subtle ? 'text-slate-600' : 'text-white'}`}>{value}</span>
        {extra}
      </div>
    </div>
  )
}
