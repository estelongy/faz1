import Link from 'next/link'
import { Package } from 'lucide-react'
import SiparisKartlari from '@/app/satici/panel/siparisler/SiparisKartlari'

type OrderItem = Parameters<typeof SiparisKartlari>[0]['items'][number]

interface Props {
  companyName: string
  items: OrderItem[]
  hasShippingSettings: boolean
  shippingHint: string | null
  defaultCarrier: string
  preferredCarriers: string[]
  durum?: string
  statusCounts: {
    pending: number
    preparing: number
    shipped: number
    delivered: number
  }
}

const FILTERS = [
  { key: 'pending', label: 'Bekleyen' },
  { key: 'preparing', label: 'Hazırlık' },
  { key: 'shipped', label: 'Kargoda' },
  { key: 'delivered', label: 'Teslim' },
] as const

export default function SiparislerAppView({
  companyName,
  items,
  hasShippingSettings,
  shippingHint,
  defaultCarrier,
  preferredCarriers,
  durum,
  statusCounts,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80 truncate">{companyName}</p>
        <p className="mt-1 text-sm text-slate-400">{items.length} sipariş listeleniyor</p>
      </header>

      {/* Sticky filter pills */}
      <div className="sticky top-0 z-10 py-3 bg-slate-950/95 backdrop-blur border-b border-slate-900">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5">
          <Link
            href="/satici/panel/siparisler"
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              !durum ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Tümü
          </Link>
          {FILTERS.map(f => {
            const count = statusCounts[f.key]
            const active = durum === f.key
            return (
              <Link
                key={f.key}
                href={`/satici/panel/siparisler?durum=${f.key}`}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                  active ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {f.label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Liste */}
      <section className="px-5 mt-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 text-sm">
            <Package size={28} className="mx-auto mb-2 opacity-50" />
            Bu filtreye uyan sipariş yok
          </div>
        ) : (
          <div className="rounded-2xl">
            <SiparisKartlari
              items={items}
              hasShippingSettings={hasShippingSettings}
              shippingHint={shippingHint}
              defaultCarrier={defaultCarrier}
              preferredCarriers={preferredCarriers}
            />
          </div>
        )}
      </section>
    </div>
  )
}
