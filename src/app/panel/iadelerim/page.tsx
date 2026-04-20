export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'İadelerim — Estelongy' }

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:   { label: 'İnceleniyor', color: 'bg-amber-500/20 text-amber-400' },
  approved:  { label: 'Onaylandı',   color: 'bg-emerald-500/20 text-emerald-400' },
  rejected:  { label: 'Reddedildi',  color: 'bg-red-500/20 text-red-400' },
  completed: { label: 'Tamamlandı',  color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'İptal',       color: 'bg-slate-700 text-slate-500' },
}

export default async function IadelerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?next=/panel/iadelerim')

  const { data: returns } = await supabase
    .from('returns')
    .select('id, status, reason, description, created_at, resolved_at, refund_amount, resolver_note, order_items(product_snapshot, line_total, orders(order_number))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panelim</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">İadelerim</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl font-black text-white mb-6">İade Taleplerim</h1>

        {!returns || returns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">↩</div>
            <p className="text-slate-400">Henüz iade talebinde bulunmadın</p>
            <Link href="/panel" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm transition-colors">
              Panelime Dön
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => {
              const item = ret.order_items as { product_snapshot?: { name?: string }; line_total?: number; orders?: { order_number?: string } } | null
              const badge = STATUS_BADGE[ret.status] ?? { label: ret.status, color: 'bg-slate-700 text-slate-400' }
              return (
                <div key={ret.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-bold text-sm">{item?.product_snapshot?.name ?? 'Ürün'}</p>
                      {item?.orders?.order_number && (
                        <Link href={`/siparis/${item.orders.order_number}`}
                          className="text-violet-400 hover:text-violet-300 text-xs transition-colors">
                          Sipariş #{item.orders.order_number}
                        </Link>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <p><span className="text-slate-400">Sebep:</span> {ret.reason}</p>
                    {ret.description && <p><span className="text-slate-400">Açıklama:</span> {ret.description}</p>}
                    <p><span className="text-slate-400">Talep Tarihi:</span> {new Date(ret.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {ret.refund_amount && (
                      <p><span className="text-slate-400">İade Tutarı:</span> <span className="text-emerald-400 font-bold">₺{Number(ret.refund_amount).toLocaleString('tr-TR')}</span></p>
                    )}
                    {ret.resolver_note && (
                      <p className="mt-2 p-2 bg-slate-900/50 rounded-lg">
                        <span className="text-slate-400">Satıcı Notu:</span> {ret.resolver_note}
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
