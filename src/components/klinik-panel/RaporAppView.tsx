import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export type RaporMonthStats = {
  label: string
  year: number
  month: number
  total: number
  completed: number
  cancelled: number
  noShow: number
  pending: number
  avgFinalScore: number | null
  avgScoreGain: number | null
  creditUsed: number
}

interface Props {
  clinicName: string
  totalCredits: number
  months: RaporMonthStats[]
  current: RaporMonthStats
  previous: RaporMonthStats
  acceptRate: number
  finalized: number
}

/**
 * EsteKlinikPRO app — /klinik/panel/rapor mobil görünümü.
 * Bu ay öne çıkan metrikler dikey kartlarda, altında 6 aylık liste.
 */
export default function RaporAppView({
  clinicName,
  totalCredits,
  months,
  current,
  previous,
  acceptRate,
  finalized,
}: Props) {
  const trendTotal = delta(current.total, previous.total)
  const trendCompleted = delta(current.completed, previous.completed)

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/80">{clinicName}</p>
        <p className="mt-1 text-sm text-slate-400">Son 6 ay performans raporu</p>
      </header>

      {/* Bu Ay */}
      <section className="px-5 mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
          Bu Ay · {current.label}
        </p>

        <div className="space-y-2.5">
          <BigCard
            label="Toplam Randevu"
            value={current.total}
            trend={trendTotal}
            color="text-white"
          />
          <BigCard
            label="Tamamlanan"
            value={current.completed}
            trend={trendCompleted}
            color="text-emerald-300"
          />
          <BigCard
            label="Kabul Oranı"
            value={`%${acceptRate.toFixed(0)}`}
            sub={`${current.completed} / ${finalized} finalize`}
            color="text-emerald-300"
          />
          <BigCard
            label="Kredi Kullanımı"
            value={current.creditUsed}
            sub={`Bakiye: ${totalCredits}`}
            color="text-amber-300"
          />
        </div>
      </section>

      {/* Skor Metrikleri */}
      <section className="px-5 mt-5 grid grid-cols-1 gap-2.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Ortalama Klinik Onaylı Skor
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums text-white">
            {current.avgFinalScore != null ? current.avgFinalScore.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Bu ay hekim onayı verilen randevuların ortalaması
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Ortalama Skor Artışı
          </p>
          <p
            className={`mt-1 text-3xl font-black tabular-nums ${
              (current.avgScoreGain ?? 0) > 0 ? 'text-emerald-300' : 'text-slate-300'
            }`}
          >
            {current.avgScoreGain != null
              ? `${current.avgScoreGain > 0 ? '+' : ''}${current.avgScoreGain.toFixed(1)}`
              : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ön analiz → klinik onaylı skora fark ortalaması
          </p>
        </div>
      </section>

      {/* 6 Aylık Liste */}
      <section className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
          6 Aylık Dağılım
        </p>
        <ul className="space-y-2">
          {[...months].reverse().map((m, i) => (
            <li
              key={`${m.year}-${m.month}`}
              className={`rounded-2xl border p-4 ${
                i === 0
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold text-sm">{m.label}</p>
                {m.avgFinalScore != null && (
                  <p className="text-base font-black text-emerald-300 tabular-nums">
                    {m.avgFinalScore.toFixed(1)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Mini label="Top" value={m.total} color="text-white" />
                <Mini label="✓" value={m.completed} color="text-emerald-300" />
                <Mini label="✕" value={m.cancelled} color="text-rose-300" />
                <Mini label="○" value={m.noShow} color="text-slate-400" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Aktif: {m.pending} · Kredi: {m.creditUsed}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {current.total === 0 && previous.total === 0 && (
        <section className="px-5 mt-5">
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-sm text-emerald-300 flex items-start gap-2">
            <BarChart3 size={16} className="shrink-0 mt-0.5" />
            <p>Henüz yeterli veri yok. Randevular arttıkça rapor zenginleşecek.</p>
          </div>
        </section>
      )}
    </div>
  )
}

function BigCard({
  label,
  value,
  sub,
  trend,
  color,
}: {
  label: string
  value: number | string
  sub?: string
  trend?: { delta: number; up: boolean; pct: number; prev: number }
  color: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-black tabular-nums ${color}`}>{value}</p>
      {trend && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            trend.up ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {trend.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>
            geçen aya göre {Math.abs(trend.delta)}
            {trend.prev > 0 && ` (${trend.up ? '+' : ''}${trend.pct.toFixed(0)}%)`}
          </span>
        </div>
      )}
      {sub && !trend && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-base font-black tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

function delta(curr: number, prev: number) {
  const d = curr - prev
  const pct = prev > 0 ? (d / prev) * 100 : 0
  return { delta: d, up: d >= 0, pct, prev }
}
