export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyGuestOrderToken, normalizeEmail } from '@/lib/guest-order-token'
import { IadeTalepForm } from './IadeTalepForm'
import KargoTakipKart from './KargoTakipKart'
import SiparisSuccessOverlay from '@/components/SiparisSuccessOverlay'
import BackButton from '@/components/BackButton'

export const metadata: Metadata = { title: 'Sipariş Takip' }

const PAYMENT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Ödeme Bekliyor', color: 'bg-amber-500/20 text-amber-400' },
  paid:     { label: 'Ödendi',          color: 'bg-emerald-500/20 text-emerald-400' },
  failed:   { label: 'Ödeme Başarısız', color: 'bg-red-500/20 text-red-400' },
  refunded: { label: 'İade Edildi',     color: 'bg-blue-500/20 text-blue-400' },
}

// Fulfillment status etiketleri artık KargoTakipKart içinde — bu sayfada
// vendor kartında /satıcı bloğunda KargoTakipKart durumu kendi gösterir.

export default async function SiparisPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ success?: string; e?: string; t?: string }>
}) {
  const { orderNumber } = await params
  const { success, e: guestEmailParam, t: guestTokenParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Misafir mi yoksa kayıtlı kullanıcı mı? Misafir için ?e=...&t=... query
  // HMAC token doğrulanıp service client ile RLS bypass yapılır.
  const isGuestAccess = !user && !!(guestEmailParam && guestTokenParam)

  if (!user && !isGuestAccess) {
    redirect(`/giris?g=estestore&next=/siparis/${orderNumber}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = null

  // Admin tüm siparişleri görebilir — user_id filtresini bypass.
  const userRole = (user?.app_metadata as Record<string, string> | undefined)?.role
  const isAdminAccess = userRole === 'admin'

  if (isAdminAccess) {
    const admin = createServiceClient()
    const { data } = await admin
      .from('orders')
      .select('*, order_items(*, vendors(company_name), returns(id, status, reason, description, created_at))')
      .eq('order_number', orderNumber)
      .single()
    order = data
  } else if (user) {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, vendors(company_name), returns(id, status, reason, description, created_at))')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .single()
    order = data
  } else if (isGuestAccess) {
    // HMAC doğrulama — token email + sipariş no'ya bağlı
    const tokenOk = verifyGuestOrderToken(orderNumber, guestEmailParam!, guestTokenParam!)
    if (!tokenOk) notFound()

    const admin = createServiceClient()
    const { data } = await admin
      .from('orders')
      .select('*, order_items(*, vendors(company_name), returns(id, status, reason, description, created_at))')
      .eq('order_number', orderNumber)
      .eq('is_guest', true)
      .eq('guest_email', normalizeEmail(guestEmailParam!))
      .single()
    order = data
  }

  if (!order) notFound()

  const paymentBadge = PAYMENT_STATUS_LABEL[order.payment_status ?? 'pending']

  type OrderItem = {
    id: string
    product_snapshot: { name?: string; image?: string; slug?: string }
    quantity: number
    unit_price: number
    line_total: number
    fulfillment_status?: string | null
    tracking_number?: string | null
    tracking_carrier?: string | null
    shipped_at?: string | null
    delivered_at?: string | null
    vendors?: { company_name?: string } | null
    returns?: { id: string; status: string; reason: string; description: string | null; created_at: string }[] | null
  }

  // 14 günlük iade penceresi hesabı
  function returnDeadline(item: OrderItem): { canReturn: boolean; deadline: Date | null; daysLeft: number | null } {
    if (item.fulfillment_status !== 'delivered' || !item.delivered_at) {
      return { canReturn: false, deadline: null, daysLeft: null }
    }
    const deliveredAt = new Date(item.delivered_at)
    const deadline = new Date(deliveredAt.getTime() + 14 * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return { canReturn: daysLeft > 0, deadline, daysLeft: Math.max(0, daysLeft) }
  }

  const itemsByVendor: Record<string, OrderItem[]> = {}
  for (const item of (order.order_items ?? []) as OrderItem[]) {
    const vname = item.vendors?.company_name ?? 'İş Ortağı'
    if (!itemsByVendor[vname]) itemsByVendor[vname] = []
    itemsByVendor[vname].push(item)
  }

  // Paket = tracking_number bazlı grup. Aynı vendor 1 siparişte birden çok
  // paket gönderebilir (vendor tek-tek "etiket bas" → her order_item ayrı
  // tracking_number alır). tracking_number=null kalemler "henüz kargoya
  // verilmemiş" grubu olarak ayrı bloklanır.
  type PackageGroup = { key: string; items: OrderItem[] }
  function groupByPackage(items: OrderItem[]): PackageGroup[] {
    const map = new Map<string, OrderItem[]>()
    let unshippedCounter = 0
    for (const it of items) {
      const key = it.tracking_number?.trim() || `__unshipped-${unshippedCounter++}`
      const arr = map.get(key) ?? []
      arr.push(it)
      map.set(key, arr)
    }
    // Eğer unshipped kalemler 1'den fazlaysa hepsini tek __unshipped grubunda
    // birleştir (her birini ayrı kart yapmaya gerek yok — hepsi aynı durum)
    const unshippedKeys = Array.from(map.keys()).filter(k => k.startsWith('__unshipped-'))
    if (unshippedKeys.length > 1) {
      const merged: OrderItem[] = []
      for (const k of unshippedKeys) { merged.push(...(map.get(k) ?? [])); map.delete(k) }
      map.set('__unshipped', merged)
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Celebration overlay — sadece ilk başarılı ödeme sonrası */}
      {success === '1' && order.payment_status === 'paid' && (
        <SiparisSuccessOverlay orderNumber={order.order_number} total={Number(order.total ?? order.total_amount ?? 0)} />
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <BackButton
            href={isAdminAccess ? '/admin/siparisler' : isGuestAccess ? '/estestore' : '/panel'}
            label={isAdminAccess ? 'Admin Sipariş' : isGuestAccess ? 'Mağaza' : 'Panelim'} />
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold truncate">{order.order_number}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Başarı banner */}
        {success === '1' && order.payment_status === 'paid' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="text-white font-bold">Siparişin alındı!</p>
                <p className="text-emerald-300 text-sm mt-0.5">İş Ortaklarımız hazırlığa başladı. E-posta ile takip bilgilendirmesi alacaksın.</p>
              </div>
            </div>
          </div>
        )}
        {isGuestAccess && order.payment_status === 'paid' && (
          <div className="mb-6 p-5 bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-2xl">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-white font-bold">Hesap oluştur, sipariş geçmişini sakla</p>
                <p className="text-slate-300 text-sm mt-0.5">İade hakkını kullanmak ve siparişlerini takip etmek için ücretsiz hesap aç.</p>
              </div>
              <Link href={`/kayit?email=${encodeURIComponent(guestEmailParam ?? '')}&next=/siparis/${order.order_number}`}
                className="px-4 py-2 bg-[#C9A961] hover:bg-[#D4B872] text-[#0F172A] text-sm font-bold rounded-lg transition-colors">
                Hesap Aç
              </Link>
            </div>
          </div>
        )}
        {success === '1' && order.payment_status === 'pending' && (
          <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-white font-bold">Ödeme işleniyor</p>
                <p className="text-amber-300 text-sm mt-0.5">Ödemen doğrulanınca siparişin kargoya hazırlanır. Bu sayfa otomatik yenilenir.</p>
              </div>
            </div>
          </div>
        )}

        {/* Özet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-1">Sipariş No</p>
            <p className="text-white font-black font-mono">{order.order_number}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-1">Tarih</p>
            <p className="text-white font-bold text-sm">
              {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-1">Ödeme</p>
            <span className={`inline-block text-sm font-bold px-2.5 py-1 rounded-full ${paymentBadge.color}`}>
              {paymentBadge.label}
            </span>
          </div>
        </div>

        {/* Adres */}
        {order.address_snapshot && (
          <div className="mb-6 p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <h3 className="text-white font-bold text-sm mb-2">📍 Teslimat Adresi</h3>
            <p className="text-slate-300 text-sm">{order.address_snapshot.full_name}</p>
            <p className="text-slate-500 text-sm mt-0.5">{order.address_snapshot.phone}</p>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {order.address_snapshot.address_line},
              {order.address_snapshot.neighborhood && ` ${order.address_snapshot.neighborhood},`}
              {' '}{order.address_snapshot.district} / {order.address_snapshot.city}
            </p>
          </div>
        )}

        {/* İş Ortağı → paket → kalem hiyerarşisi.
            Aynı vendor 1 siparişte birden çok pakete bölebilir
            (tracking_number başına grup). Her paket kendi takip kartını
            ve "Teslim Aldım" akışını taşır. */}
        <div className="space-y-4 mb-6">
          {Object.entries(itemsByVendor).map(([vendorName, vendorItems]) => {
            const packages = groupByPackage(vendorItems)
            return (
            <div key={vendorName} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">{vendorName}</span>
                {packages.length > 1 && (
                  <span className="text-slate-500 text-xs">{packages.length} paket</span>
                )}
              </div>

              {packages.map((pkg, pkgIdx) => {
                const head = pkg.items[0]
                const isUnshipped = pkg.key.startsWith('__unshipped')
                return (
                <div key={pkg.key} className={pkgIdx > 0 ? 'border-t-4 border-slate-900/60' : ''}>
                  {packages.length > 1 && (
                    <div className="px-5 pt-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      {isUnshipped ? 'Henüz Kargoya Verilmedi' : `Paket ${pkgIdx + 1}`}
                    </div>
                  )}

              {/* Kalemler */}
              <div className="divide-y divide-slate-700">
                {pkg.items.map(item => {
                  const snap = item.product_snapshot as { name?: string; image?: string; slug?: string }
                  const { canReturn, deadline, daysLeft } = returnDeadline(item)
                  return (
                    <div key={item.id}>
                      <div className="flex gap-4 p-4">
                        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {snap?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={snap.image} alt={snap.name ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{snap?.name ?? 'Ürün'}</p>
                          <p className="text-slate-500 text-sm mt-0.5">
                            {item.quantity} adet × ₺{Number(item.unit_price).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-bold text-sm">₺{Number(item.line_total).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      {/* İade penceresi göstergesi */}
                      {item.fulfillment_status === 'delivered' && deadline && (
                        <div className={`mx-4 mb-2 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
                          canReturn
                            ? daysLeft! <= 3
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-slate-700/50 text-slate-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          <span>{canReturn ? '📅' : '⛔'}</span>
                          {canReturn
                            ? `İade hakkı: ${daysLeft} gün kaldı (${deadline.toLocaleDateString('tr-TR')})`
                            : `İade süresi doldu (${deadline.toLocaleDateString('tr-TR')})`
                          }
                        </div>
                      )}
                      {order.payment_status === 'paid' && !isGuestAccess && !isAdminAccess && (
                        <div className="px-4 pb-3">
                          <IadeTalepForm
                            orderItemId={item.id}
                            productName={snap?.name ?? 'Ürün'}
                            fulfillmentStatus={item.fulfillment_status ?? null}
                            existingReturn={item.returns?.[0] ?? null}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Paket bazlı kargo durumu + takip + Teslim Aldım */}
              <KargoTakipKart
                orderNumber={order.order_number}
                orderItemIds={pkg.items.map(i => i.id)}
                trackingNumber={isUnshipped ? null : (head?.tracking_number ?? null)}
                carrier={isUnshipped ? null : (head?.tracking_carrier ?? null)}
                shippedAt={head?.shipped_at ?? null}
                fulfillmentStatus={head?.fulfillment_status ?? 'pending'}
                canConfirmDelivery={!!user && !isGuestAccess && !isAdminAccess && order.payment_status === 'paid'}
              />
                </div>
                )
              })}
            </div>
            )
          })}
        </div>

        {/* Toplam */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Ara Toplam</span>
              <span className="text-white">₺{Number(order.subtotal ?? order.total_amount ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            {Number(order.shipping_fee ?? 0) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Kargo</span>
                <span className="text-white">₺{Number(order.shipping_fee).toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-700 mt-2">
              <span className="text-slate-300 font-medium">Toplam</span>
              <span className="text-white font-black text-2xl">
                ₺{Number(order.total ?? order.total_amount ?? 0).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/estestore" className="text-[#C9A961] hover:text-[#C9A961] text-base transition-colors font-semibold">
            Alışverişe Devam Et →
          </Link>
        </div>
      </div>
    </main>
  )
}
