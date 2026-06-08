import type { MetricScore } from '@/lib/vendor-performance'

interface Props {
  letter: string
  totalScore: number
  totalOrders: number
  hasEnoughData: boolean
  metrics: MetricScore[]
}

function letterStyle(letter: string) {
  switch (letter) {
    case 'A': return { bg: 'bg-emerald-500/15', fg: 'text-emerald-300', ring: 'ring-emerald-500/40' }
    case 'B': return { bg: 'bg-amber-500/15', fg: 'text-amber-300', ring: 'ring-amber-500/40' }
    case 'C': return { bg: 'bg-amber-500/15', fg: 'text-amber-300', ring: 'ring-amber-500/40' }
    case 'D': return { bg: 'bg-orange-500/15', fg: 'text-orange-300', ring: 'ring-orange-500/40' }
    default:  return { bg: 'bg-rose-500/15', fg: 'text-rose-300', ring: 'ring-rose-500/40' }
  }
}

function bandStyle(band: MetricScore['band']) {
  switch (band) {
    case 'good': return { fg: 'text-emerald-300', bar: 'bg-emerald-400', icon: '✓' }
    case 'ok':   return { fg: 'text-amber-300',   bar: 'bg-amber-400',   icon: '○' }
    default:     return { fg: 'text-rose-300',    bar: 'bg-rose-400',    icon: '!' }
  }
}

export default function PerformansAppView({
  letter, totalScore, totalOrders, hasEnoughData, metrics,
}: Props) {
  const colors = letterStyle(letter)
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Performans Skoru</p>
        <p className="mt-1 text-sm text-slate-400">Son 90 günün özeti</p>
      </header>

      {/* Toplam skor */}
      <section className="px-5 mt-3">
        <div className={`rounded-3xl ${colors.bg} border border-slate-800 ring-2 ${colors.ring} p-5`}>
          <div className="flex items-center gap-4">
            <div className={`shrink-0 w-20 h-20 rounded-2xl ${colors.bg} flex items-center justify-center text-5xl font-black ${colors.fg}`}>
              {letter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Toplam</p>
              <p className="text-4xl font-black tabular-nums">
                {totalScore}<span className="text-slate-500 text-xl">/100</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Son 90 günde {totalOrders} sipariş işledin.
              </p>
            </div>
          </div>
          {!hasEnoughData && (
            <p className="mt-3 px-3 py-2 rounded-lg bg-slate-900/60 text-slate-400 text-xs">
              ⏳ Yeterli veri yok. 5+ siparişten sonra skor kalibre olur.
            </p>
          )}
        </div>
      </section>

      {/* Metrikler */}
      <section className="px-5 mt-5 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Detay Metrikler</p>
        {metrics.map(m => {
          const style = bandStyle(m.band)
          return (
            <div key={m.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${style.fg} bg-slate-900`}>
                    {style.icon}
                  </span>
                  <h3 className="text-white font-medium text-sm truncate">{m.label}</h3>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-black ${style.fg}`}>{m.value}</span>
                  <span className="text-slate-500 text-xs ml-1">{m.unit}</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900/50 overflow-hidden mb-2">
                <div className={`h-full ${style.bar}`} style={{ width: `${(m.score / 20) * 100}%` }} />
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{m.description}</p>
              <p className="text-slate-500 text-[10px] mt-1">{m.score}/20 puan</p>
            </div>
          )
        })}
      </section>

      <section className="px-5 mt-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-1">
          <p className="text-slate-200 font-bold text-sm mb-1">Nasıl hesaplanıyor?</p>
          <p>5 metrik × 20 puan = 100. Yalnız son 90 gün.</p>
          <p className="mt-2 text-slate-500">B (75+) ve üstü &quot;güvenli satıcı&quot; rozeti kazanır. 60 altı vitrin riskine girer.</p>
        </div>
      </section>
    </div>
  )
}
