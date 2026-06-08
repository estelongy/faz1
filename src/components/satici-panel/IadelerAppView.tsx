import Link from 'next/link'
import IadeKararForm from '@/app/satici/panel/iadeler/IadeKararForm'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'bg-amber-500/15 text-amber-300' },
  approved: { label: 'Onaylı', cls: 'bg-emerald-500/15 text-emerald-300' },
  rejected: { label: 'Reddedildi', cls: 'bg-rose-500/15 text-rose-300' },
  completed: { label: 'Tamamlandı', cls: 'bg-sky-500/15 text-sky-300' },
  cancelled: { label: 'İptal', cls: 'bg-slate-800 text-slate-400' },
}

export type IadeKalem = {
  id: string
  status: string
  reason: string
  description: string | null
  resolver_note: string | null
  created_at: string
  refund_amount: number | null
  product_name: string
  order_number: string | null
  line_total: number | null
}

interface Props {
  items: IadeKalem[]
  durum?: string
}

const FILTERS = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'approved', label: 'Onaylı' },
  { key: 'rejected', label: 'Reddedildi' },
]

export default function IadelerAppView({ items, durum }: Props) {
  const active = durum ?? 'tumu'
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">İade Talepleri</p>
        <p className="mt-1 text-sm text-slate-400">{items.length} talep</p>
      </header>

      <div className="sticky top-0 z-10 px-5 py-3 bg-slate-950/95 backdrop-blur border-b border-slate-900">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <Link
              key={f.key}
              href={`/satici/panel/iadeler?durum=${f.key}`}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                active === f.key ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="px-5 mt-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 text-sm">
            İade talebi yok
          </div>
        ) : (
          items.map(ret => {
            const badge = STATUS_BADGE[ret.status] ?? { label: ret.status, cls: 'bg-slate-800 text-slate-400' }
            return (
              <div key={ret.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{ret.product_name}</p>
                    {ret.order_number && (
                      <p className="text-slate-500 text-xs mt-0.5">#{ret.order_number}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(ret.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${badge.cls}`}>{badge.label}</span>
                    {ret.line_total != null && (
                      <p className="text-white font-bold mt-1 text-sm">₺{Number(ret.line_total).toLocaleString('tr-TR')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <p><span className="text-slate-500">Sebep:</span> {ret.reason}</p>
                  {ret.description && (
                    <p><span className="text-slate-500">Açıklama:</span> {ret.description}</p>
                  )}
                  {ret.resolver_note && (
                    <p className="mt-2 p-2 bg-slate-900 rounded-lg text-slate-300">
                      <span className="text-slate-500">Notun:</span> {ret.resolver_note}
                    </p>
                  )}
                </div>

                {ret.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <IadeKararForm returnId={ret.id} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
