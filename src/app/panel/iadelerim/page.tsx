export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/BackButton'

import SafeLink from '@/components/SafeLink'
export const metadata: Metadata = { title: 'İadelerim — Estelongy' }

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:   { label: 'İnceleniyor', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  approved:  { label: 'Onaylandı',   color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  rejected:  { label: 'Reddedildi',  color: 'bg-red-100 text-red-700 border border-red-200' },
  completed: { label: 'Tamamlandı',  color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  cancelled: { label: 'İptal',       color: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

export default async function IadelerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?g=estestore&next=/panel/iadelerim')

  const { data: returns } = await supabase
    .from('returns')
    .select('id, status, reason, description, created_at, resolved_at, refund_amount, resolver_note, order_items(product_snapshot, line_total, orders(order_number))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <BackButton href="/panel" label="Panelim" />
          <span className="text-slate-300">|</span>
          <span className="text-slate-900 text-sm font-bold">İadelerim</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 lg:pt-24 pb-24 lg:pb-16">
        <h1 className="text-2xl font-black text-slate-900 mb-6">İade Taleplerim</h1>

        {!returns || returns.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="text-5xl mb-4">↩</div>
            <p className="text-slate-600">Henüz iade talebinde bulunmadın</p>
            <SafeLink href="/panel" className="mt-4 inline-block text-[#8B7339] hover:text-[#6B5828] text-base transition-colors font-semibold">
              Panelime Dön
            </SafeLink>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => {
              const item = ret.order_items as unknown as { product_snapshot?: { name?: string }; line_total?: number; orders?: { order_number?: string } } | null
              const badge = STATUS_BADGE[ret.status] ?? { label: ret.status, color: 'bg-slate-100 text-slate-600 border border-slate-200' }
              return (
                <div key={ret.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-slate-900 font-bold text-sm">{item?.product_snapshot?.name ?? 'Ürün'}</p>
                      {item?.orders?.order_number && (
                        <SafeLink href={`/siparis/${item.orders.order_number}`}
                          className="text-[#8B7339] hover:text-[#6B5828] text-base transition-colors font-semibold">
                          Sipariş #{item.orders.order_number}
                        </SafeLink>
                      )}
                    </div>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    <p><span className="text-slate-500">Sebep:</span> {ret.reason}</p>
                    {ret.description && <p><span className="text-slate-500">Açıklama:</span> {ret.description}</p>}
                    <p><span className="text-slate-500">Talep Tarihi:</span> {new Date(ret.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {ret.refund_amount && (
                      <p><span className="text-slate-500">İade Tutarı:</span> <span className="text-emerald-700 font-bold">₺{Number(ret.refund_amount).toLocaleString('tr-TR')}</span></p>
                    )}
                    {ret.resolver_note && (
                      <p className="mt-2 p-2 bg-[#FAFAF7] border border-slate-200 rounded-lg">
                        <span className="text-slate-500">İş Ortağı Notu:</span> {ret.resolver_note}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
