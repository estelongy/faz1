import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

export type AylikOzet = { ym: string; label: string; gross: number; commis: number; net: number; count: number }

interface Props {
  companyName: string
  commissionPct: number
  totalGross: number
  totalCommis: number
  deliveredNet: number
  pendingNet: number
  lineCount: number
  months: AylikOzet[]
  payoutsEnabled: boolean
  grossChangePct: number | null
}

export default function KazancAppView({
  companyName,
  commissionPct,
  totalGross,
  totalCommis,
  deliveredNet,
  pendingNet,
  lineCount,
  months,
  payoutsEnabled,
  grossChangePct,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80 truncate">{companyName}</p>
        <p className="mt-1 text-sm text-slate-400">%{commissionPct.toFixed(0)} platform komisyonu · {lineCount} satış</p>
      </header>

      {!payoutsEnabled && (
        <Link
          href="/satici/panel/odeme-hesabi"
          className="mx-5 mt-2 flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 active:bg-amber-500/15 transition"
        >
          <AlertTriangle size={18} className="shrink-0 text-amber-300" />
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-bold">Banka çekimi aktif değil</p>
            <p className="text-amber-300/80 text-xs mt-0.5">Kazançların banka hesabına çekilebilsin diye ödeme hesabını tamamla.</p>
          </div>
          <span className="text-amber-300">→</span>
        </Link>
      )}

      {/* Bu Ay kartlar */}
      <section className="px-5 mt-4 space-y-2.5">
        <BigCard
          label="Teslim Edilen Net"
          value={`₺${deliveredNet.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`}
          color="text-emerald-300"
          sub="transfer oldu"
        />
        <BigCard
          label="Süreçteki Net"
          value={`₺${pendingNet.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`}
          color="text-amber-300"
          sub="teslim bekliyor"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <MiniCard
            label="Toplam Ciro"
            value={`₺${totalGross.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
            color="text-white"
            trend={grossChangePct}
          />
          <MiniCard
            label="Komisyon"
            value={`₺${totalCommis.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
            color="text-rose-300"
          />
        </div>
      </section>

      {/* Aylık liste */}
      <section className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Aylık Özet</p>
        {months.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <Wallet size={24} className="opacity-50" />
            Henüz satış yok
          </div>
        ) : (
          <ul className="space-y-2">
            {months.map((m, i) => (
              <li
                key={m.ym}
                className={`rounded-2xl border p-4 ${
                  i === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm">{m.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{m.count} satış · ₺{m.gross.toLocaleString('tr-TR')} ciro</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-300 font-black text-lg tabular-nums">₺{m.net.toLocaleString('tr-TR')}</p>
                    <p className="text-slate-500 text-[10px]">komisyon ₺{m.commis.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function BigCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function MiniCard({
  label, value, color, trend,
}: { label: string; value: string; color: string; trend?: number | null }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${color}`}>{value}</p>
      {trend != null && (
        <div className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${trend >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>%{Math.abs(trend)}</span>
        </div>
      )}
    </div>
  )
}
