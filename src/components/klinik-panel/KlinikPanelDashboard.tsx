import Link from 'next/link'
import TercihliKartlarSection from './TercihliKartlarSection'
import AkreditasyonKart from './AkreditasyonKart'
import type { Accreditation } from '@/lib/clinic-accreditation'

interface TodayAppt {
  id: string
  time: string | null
  patientName: string
  status: string
}

interface UretimMetrics {
  thisMonthCount: number
  monthDelta: number
  acceptanceRate: number
  klinikOnayiSayisi: number
}

interface Props {
  hekimName: string | null
  clinicName: string
  todayAppts: TodayAppt[]
  pendingCount: number
  uretimMetrics: UretimMetrics
  totalCredit: number
  accreditation: Accreditation
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-amber-500/20 text-amber-400',
  confirmed:   'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-violet-500/20 text-violet-400',
  completed:   'bg-emerald-500/20 text-emerald-400',
  cancelled:   'bg-red-500/20 text-red-400',
  no_show:     'bg-slate-500/20 text-slate-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Beklemede', confirmed: 'Onaylı', in_progress: 'Görüşmede',
  completed: 'Tamamlandı', cancelled: 'İptal', no_show: 'Gelmedi',
}

export default function KlinikPanelDashboard({
  hekimName, clinicName, todayAppts, pendingCount, uretimMetrics, totalCredit, accreditation,
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
          <Link href="/klinik/panel/jeton"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:opacity-80 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {totalCredit} Kredi
          </Link>
        </div>
      </header>

      {/* ─── KATMAN 1 — ŞİMDİ ─────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-2 px-1">Şimdi</p>
        <BugununAkisiCard todayAppts={todayAppts} pendingCount={pendingCount} />
      </section>

      {/* ─── KATMAN 2 — BU AY ─────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-2 px-1">Bu Ay</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <UretiminCard metrics={uretimMetrics} />
          <AkreditasyonKart accreditation={accreditation} />
          <SonucVitriniCard />
        </div>
      </section>

      {/* ─── KATMAN 3 — UZUN VADE (TERCİHLİ) ──────────────────────── */}
      <TercihliKartlarSection />
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
// SABİT KARTLAR
// ───────────────────────────────────────────────────────────────────

function BugununAkisiCard({ todayAppts, pendingCount }: { todayAppts: TodayAppt[]; pendingCount: number }) {
  const formatTime = (t: string | null) => t
    ? new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <Link
      href="/klinik/panel/takvim"
      className="block group relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/30 hover:border-violet-500/50 transition-all"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Bugünün Akışı</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {todayAppts.length > 0
                  ? `${todayAppts.length} randevu${pendingCount > 0 ? ` · ${pendingCount} onay bekliyor` : ''}`
                  : pendingCount > 0
                    ? `${pendingCount} onay bekliyor`
                    : 'Bugün boş — yarına bakabilirsin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-violet-300 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Takvime git
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h15" />
            </svg>
          </div>
        </div>

        {todayAppts.length > 0 ? (
          <div className="space-y-2">
            {todayAppts.slice(0, 3).map(apt => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-violet-300 font-mono text-sm font-bold w-12 shrink-0">{formatTime(apt.time)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{apt.patientName}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[apt.status] ?? STATUS_COLOR.pending}`}>
                  {STATUS_LABEL[apt.status] ?? apt.status}
                </span>
              </div>
            ))}
            {todayAppts.length > 3 && (
              <p className="text-center text-slate-500 text-xs pt-1">+{todayAppts.length - 3} daha</p>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-slate-500 text-sm">
              {pendingCount > 0
                ? `${pendingCount} onay bekleyen randevuya bakmak için takvime git`
                : 'Bugün açık slot yok. Müsaitlik takvimini güncelleyerek hasta kabulüne devam edebilirsin.'}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

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

function SonucVitriniCard() {
  // Placeholder — rıza akışı kurulana kadar boş state
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
          Hastalarından paylaşım izni aldıkça en yüksek Δ vakaların burada öne çıkar.
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-600 italic text-center">
        Rıza akışı yakında
      </div>
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
