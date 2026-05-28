export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'

export const metadata: Metadata = { title: 'Admin · Siparişler' }

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Ödeme Bekliyor', color: 'bg-amber-500/20 text-amber-400' },
  paid:     { label: 'Ödendi',         color: 'bg-emerald-500/20 text-emerald-400' },
  failed:   { label: 'Başarısız',      color: 'bg-red-500/20 text-red-400' },
  refunded: { label: 'İade Edildi',    color: 'bg-blue-500/20 text-blue-400' },
}

const PAGE_SIZE = 50

export default async function AdminSiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; ara?: string; sayfa?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect(pathForRole(role))

  const { durum, ara, sayfa } = await searchParams
  const page = Math.max(1, Number(sayfa ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, payment_status, status, total, total_amount, subtotal, shipping_fee,
      created_at, user_id, is_guest, guest_email, guest_name, guest_phone,
      address_snapshot, coupon_code, coupon_discount, stripe_payment_intent_id,
      order_items(id, quantity, line_total, fulfillment_status, vendors(company_name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (durum && durum !== 'tumu') query = query.eq('payment_status', durum)
  if (ara && ara.trim()) {
    const q = ara.trim()
    // order_number veya guest_email içeren — ilike OR
    query = query.or(`order_number.ilike.%${q}%,guest_email.ilike.%${q}%,guest_name.ilike.%${q}%`)
  }

  const { data: orders, count } = await query

  // Kayıtlı kullanıcı isimleri için profiles çek
  const userIds = Array.from(new Set((orders ?? []).map(o => o.user_id).filter(Boolean))) as string[]
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> }
  const nameByUser = new Map((profiles ?? []).map(p => [p.id, p.full_name]))

  // Toplam sayım için ayrı sorgu (durum filtresine göre)
  const { data: allOrders } = await supabase
    .from('orders')
    .select('payment_status, is_guest')

  const counts = {
    tumu: allOrders?.length ?? 0,
    pending:  (allOrders ?? []).filter(o => o.payment_status === 'pending').length,
    paid:     (allOrders ?? []).filter(o => o.payment_status === 'paid').length,
    failed:   (allOrders ?? []).filter(o => o.payment_status === 'failed').length,
    refunded: (allOrders ?? []).filter(o => o.payment_status === 'refunded').length,
    guest:    (allOrders ?? []).filter(o => o.is_guest).length,
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:ml-56">
        <div className="mb-6">
          <Link href="/admin" className="text-slate-400 hover:text-white text-base transition-colors font-semibold">← Admin</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Siparişler</h1>
          <p className="text-slate-400 text-sm mt-1">
            Tüm platform siparişleri · {counts.guest} misafir sipariş · son 50 / sayfa
          </p>
        </div>

        {/* Özet kartları */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-slate-500 text-sm">Toplam</p>
            <p className="text-2xl font-black text-white">{counts.tumu}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-amber-400/70 text-sm">Bekleyen</p>
            <p className="text-2xl font-black text-amber-400">{counts.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-emerald-400/70 text-sm">Ödenen</p>
            <p className="text-2xl font-black text-emerald-400">{counts.paid}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-red-400/70 text-sm">Başarısız</p>
            <p className="text-2xl font-black text-red-400">{counts.failed}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-blue-400/70 text-sm">İade</p>
            <p className="text-2xl font-black text-blue-400">{counts.refunded}</p>
          </div>
        </div>

        {/* Arama + Filtre */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <form className="flex-1">
            <input
              type="text"
              name="ara"
              defaultValue={ara ?? ''}
              placeholder="Sipariş no, müşteri email veya ad ile ara..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500"
            />
            {durum && <input type="hidden" name="durum" value={durum} />}
          </form>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'tumu', label: 'Tümü' },
              { key: 'pending', label: 'Bekleyen' },
              { key: 'paid', label: 'Ödenen' },
              { key: 'failed', label: 'Başarısız' },
              { key: 'refunded', label: 'İade' },
            ].map(f => {
              const params = new URLSearchParams()
              if (f.key !== 'tumu') params.set('durum', f.key)
              if (ara) params.set('ara', ara)
              return (
                <Link key={f.key} href={`/admin/siparisler${params.toString() ? `?${params.toString()}` : ''}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (durum ?? 'tumu') === f.key
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                  }`}>
                  {f.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Tablo */}
        {!orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-slate-400">Sipariş bulunamadı</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Sipariş No</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Müşteri</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Tarih</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-semibold">Tutar</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Ödeme</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">İş Ortakları</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {orders.map(o => {
                    const items = (o.order_items ?? []) as unknown as Array<{
                      id: string; quantity: number; line_total: number
                      fulfillment_status: string | null
                      vendors: { company_name: string } | { company_name: string }[] | null
                    }>
                    const vendorNames = Array.from(new Set(items.flatMap(i => {
                      if (!i.vendors) return []
                      return Array.isArray(i.vendors) ? i.vendors.map(v => v.company_name) : [i.vendors.company_name]
                    }).filter(Boolean)))
                    const pay = PAYMENT_BADGE[o.payment_status ?? 'pending'] ?? { label: o.payment_status ?? '—', color: 'bg-slate-700 text-slate-400' }
                    const customer = o.is_guest
                      ? `${o.guest_name ?? '—'} (misafir)`
                      : (o.user_id ? nameByUser.get(o.user_id) ?? '—' : '—')
                    const contact = o.is_guest ? o.guest_email : '—'
                    return (
                      <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/siparis/${o.order_number}`} className="text-violet-400 hover:text-violet-300 font-mono font-bold">
                            {o.order_number}
                          </Link>
                          {o.is_guest && (
                            <div className="text-xs text-amber-400 mt-0.5">misafir</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <div>{customer}</div>
                          {contact && contact !== '—' && (
                            <div className="text-xs text-slate-500 mt-0.5">{contact}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(o.created_at).toLocaleString('tr-TR', {
                            day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold">
                          ₺{Number(o.total ?? o.total_amount ?? 0).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${pay.color}`}>
                            {pay.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {vendorNames.length > 0 ? vendorNames.slice(0, 2).join(', ') : '—'}
                          {vendorNames.length > 2 && <span className="text-slate-500"> +{vendorNames.length - 2}</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/siparis/${o.order_number}`}
                            className="text-violet-400 hover:text-violet-300 text-xs font-semibold">
                            Detay →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 && (
              <Link href={`/admin/siparisler?${new URLSearchParams({
                ...(durum ? { durum } : {}),
                ...(ara ? { ara } : {}),
                sayfa: String(page - 1),
              }).toString()}`}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:text-white">
                ← Önceki
              </Link>
            )}
            <span className="text-slate-400 text-sm">
              Sayfa <strong className="text-white">{page}</strong> / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/admin/siparisler?${new URLSearchParams({
                ...(durum ? { durum } : {}),
                ...(ara ? { ara } : {}),
                sayfa: String(page + 1),
              }).toString()}`}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:text-white">
                Sonraki →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
