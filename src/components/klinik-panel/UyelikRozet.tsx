import type { UyelikDurumu } from '@/lib/uyelik'

const TON: Record<string, string> = {
  primula: 'bg-slate-700/60 text-slate-300 ring-slate-600/50',
  elita:   'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  optima:  'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  maxima:  'bg-violet-500/15 text-violet-300 ring-violet-500/40',
  suprema: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
}

const TRY = (n: number) =>
  '₺' + Math.round(n).toLocaleString('tr-TR')

/**
 * Exclusive Member rozeti.
 * Hastaya puan GÖSTERİLMEZ — sadece kademe adı ve bir üste kalan TL.
 * Gerekçe: docs/uyelik-sistemi.md §5b
 */
export default function UyelikRozet({
  uyelik, kalan = false,
}: { uyelik: UyelikDurumu; kalan?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 min-w-0">
      <span
        className={`text-[11px] font-bold px-1.5 py-0.5 rounded ring-1 shrink-0 ${TON[uyelik.kademe] ?? TON.primula}`}
        title={`%${uyelik.indirim} üye indirimi`}>
        {uyelik.kademeAdi}
      </span>
      {kalan && uyelik.sonrakiKademeAdi && (uyelik.kalanTl > 0 || uyelik.kalanZiyaret > 0) && (
        <span className="text-[11px] text-slate-500 truncate">
          {uyelik.sonrakiKademeAdi}&rsquo;ya{' '}
          {/* Optima'ya kadar ölçü para, üstünde ziyaret. */}
          {uyelik.kalanZiyaret > 0
            ? `${uyelik.kalanZiyaret} ziyaret`
            : TRY(uyelik.kalanTl)}
        </span>
      )}
    </span>
  )
}
