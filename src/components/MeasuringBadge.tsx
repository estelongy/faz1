import { MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'

/**
 * Klinik EGP eşiği (20 yorum) altındaki klinikler için "Ölçülüyor" rozeti.
 * NHS FFT standardı: yetersiz veride puan göstermek istatistiksel olarak yanıltıcı.
 *
 * Variants:
 *   - 'mini'   → klinik kart köşeleri (RandevuFlow, klinikler listesi)
 *   - 'badge'  → modal & detay sayfası büyük rozet
 */
export default function MeasuringBadge({
  reviewCount,
  variant = 'mini',
}: {
  reviewCount: number | null
  variant?: 'mini' | 'badge'
}) {
  const n = reviewCount ?? 0
  const remaining = Math.max(MIN_REVIEWS_THRESHOLD - n, 0)
  const pct = Math.min((n / MIN_REVIEWS_THRESHOLD) * 100, 100)

  if (variant === 'mini') {
    return (
      <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-slate-800/60 border-slate-700" title={`${n}/${MIN_REVIEWS_THRESHOLD} yorum — ölçüm devam ediyor`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
        </span>
        <p className="text-sm uppercase tracking-wider text-slate-300 font-bold leading-none">Ölçülüyor</p>
      </div>
    )
  }

  // badge — büyük versiyon
  return (
    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-400" />
        </span>
        <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">Ölçüm Devam Ediyor</p>
      </div>
      <div className="mb-3">
        <p className="text-3xl font-black text-slate-300">{n}<span className="text-slate-600 text-xl">/{MIN_REVIEWS_THRESHOLD}</span></p>
        <p className="text-sm text-slate-500 mt-1">deneyim toplandı</p>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">
        {remaining > 0
          ? <>Klinik EGP rozeti için <strong className="text-slate-300">{remaining} yorum</strong> daha gerekli. NHS FFT standardı: az veride puan göstermek yanıltıcı.</>
          : <>Eşik tamamlandı, EGP yakında görünür.</>}
      </p>
    </div>
  )
}
