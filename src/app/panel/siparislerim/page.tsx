export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/BackButton'

import SafeLink from '@/components/SafeLink'
export const metadata: Metadata = { title: 'Siparişlerim — Estelongy' }

const STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Ödeme Bekliyor', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  paid:     { label: 'Ödendi',          color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  failed:   { label: 'Başarısız',       color: 'bg-red-100 text-red-700 border border-red-200' },
  refunded: { label: 'İade Edildi',     color: 'bg-blue-100 text-blue-700 border border-blue-200' },
}

// Order_items'taki fulfillment_status'ların özetlenmiş halini üretir.
// Birden fazla vendor varsa: "en geri" durumu yansıt (müşteri için "en az
// hazır olan kalem" siparişin gerçek halidir).
const FULFILLMENT_ORDER = ['cancelled', 'returned', 'pending', 'preparing', 'shipped', 'delivered']
const FULFILLMENT_META: Record<string, { label: string; cls: string; icon: string }> = {
  pending:    { label: 'Hazırlanacak',     cls: 'bg-amber-100 text-amber-700 border border-amber-200',     icon: '⏳' },
  preparing:  { label: 'Hazırlanıyor',     cls: 'bg-blue-100 text-blue-700 border border-blue-200',       icon: '📦' },
  shipped:    { label: 'Kargoda',          cls: 'bg-[#C9A961]/15 text-[#8B7339] border border-[#C9A961]/30', icon: '🚚' },
  delivered:  { label: 'Teslim Edildi',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: '✓' },
  cancelled:  { label: 'İptal',            cls: 'bg-red-100 text-red-700 border border-red-200',           icon: '✕' },
  returned:   { label: 'İade',             cls: 'bg-slate-100 text-slate-700 border border-slate-200',     icon: '↩' },
}

function summarizeFulfillment(statuses: (string | null | undefined)[]): { label: string; cls: string; icon: string } | null {
  const present = statuses.filter((s): s is string => !!s)
  if (present.length === 0) return null
  // En geri olan durumu yansıt; cancelled/returned ayrı işaretlenir
  for (const s of FULFILLMENT_ORDER) {
    if (present.includes(s)) return FULFILLMENT_META[s] ?? null
  }
  return null
}

export default async function SiparislerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?g=estestore&next=/panel/siparislerim')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, payment_status, status, total, created_at, order_items(product_snapshot, quantity, fulfillment_status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <BackButton href="/panel" label="Panelim" />
          <span className="text-slate-300">|</span>
          <span className="text-slate-900 text-sm font-bold">Siparişlerim</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 lg:pt-24 pb-24 lg:pb-16">
        <h1 className="text-2xl font-black text-slate-900 tracking-[-0.02em] mb-1">Siparişlerim</h1>
        <p className="text-slate-600 text-sm mb-6">
          {orders && orders.length > 0
            ? `${orders.length} sipariş — en yeniden başlayarak`
            : ''}
        </p>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-slate-700 font-semibold mb-1">Henüz sipariş vermedin</p>
            <p className="text-slate-500 text-sm">EsteStore’da seni bekleyen Estelongy Puanlı seçkiler var.</p>
            <Link href="/estestore" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C9A961] to-[#B8964F] active:from-[#D4B872] text-[#0F172A] text-sm font-bold rounded-xl shadow-md shadow-[#C9A961]/20">
              EsteStore’a Git →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const badge = STATUS[o.payment_status ?? 'pending'] ?? { label: o.payment_status, color: 'bg-slate-100 text-slate-700 border border-slate-200' }
              const items = (o.order_items ?? []) as { product_snapshot?: { name?: string }; quantity?: number; fulfillment_status?: string | null }[]
              const firstNames = items.slice(0, 2).map(x => x.product_snapshot?.name ?? 'Ürün').join(', ')
              const more = items.length > 2 ? ` +${items.length - 2}` : ''
              const isDelivered = (o as { status?: string }).status === 'delivered'
              const fulfillment = o.payment_status === 'paid'
                ? summarizeFulfillment(items.map(i => i.fulfillment_status))
                : null
              return (
                <div key={o.id} className="space-y-2">
                  <SafeLink href={`/siparis/${o.order_number}`}
                    className="block bg-white border border-slate-200 active:border-[#C9A961]/50 rounded-2xl p-5 transition-colors shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-bold font-mono text-sm">{o.order_number}</p>
                        <p className="text-slate-700 text-sm mt-1 line-clamp-1">{firstNames}{more}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(o.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1.5">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                        {fulfillment && (
                          <div>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${fulfillment.cls}`}>
                              <span>{fulfillment.icon}</span>{fulfillment.label}
                            </span>
                          </div>
                        )}
                        <p className="text-slate-900 font-black mt-1.5 tabular-nums">₺{Number(o.total ?? 0).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  </SafeLink>
                  {isDelivered && (
                    <SafeLink href={`/panel/urun-degerlendir/${o.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-50 active:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-bold transition-colors">
                      ⭐ Ürünleri Değerlendir
                    </SafeLink>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
