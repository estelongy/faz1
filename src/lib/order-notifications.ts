/**
 * Sipariş yaşam döngüsü bildirimleri.
 *
 * Tetikleyiciler:
 *  - notifyOrderShipped(orderItemId)        → kargoGuncelleAction sonrası
 *  - notifyOrderDelivered(orderItemId)      → fulfillment 'delivered' sonrası
 *  - notifyReturnDecision(returnId)         → iadeKararAction sonrası
 *  - notifyVendorNewOrder(orderId)          → stripe webhook 'paid' sonrası (her vendor için 1 mail)
 *
 * Hepsi fire-and-forget — başarısızlık UI'yı bloklamaz, console'a yazılır.
 * Email kaynağı: misafir ise orders.guest_email; kayıtlı ise auth.users.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/notifications'
import { sendInfoSms } from '@/lib/netgsm'
import { signGuestOrderToken } from '@/lib/guest-order-token'

// ── URL yardımcısı ────────────────────────────────────────────────────
function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com').replace(/\/$/, '')
}

/** Siparişe özel takip URL'i — misafir ise HMAC'lı. */
function trackingUrlForOrder(order: { order_number: string; is_guest?: boolean | null; guest_email?: string | null }): string {
  const base = `${baseUrl()}/siparis/${order.order_number}`
  if (order.is_guest && order.guest_email) {
    const token = signGuestOrderToken(order.order_number, order.guest_email)
    const q = new URLSearchParams({ e: order.guest_email, t: token })
    return `${base}?${q.toString()}`
  }
  return base
}

/** Misafir ise guest_email; kayıtlı ise auth.users üzerinden email. */
async function resolveBuyerEmail(
  admin: ReturnType<typeof createServiceClient>,
  order: { user_id: string | null; is_guest: boolean | null; guest_email: string | null }
): Promise<string | null> {
  if (order.is_guest && order.guest_email) return order.guest_email
  if (!order.user_id) return null
  const { data } = await admin.auth.admin.getUserById(order.user_id)
  return data?.user?.email ?? null
}

function buyerPhoneOf(order: { is_guest: boolean | null; guest_phone: string | null; address_snapshot: { phone?: string } | null }): string | null {
  if (order.is_guest && order.guest_phone) return order.guest_phone
  return order.address_snapshot?.phone ?? null
}

// ── Şablon: kargoya verildi ──────────────────────────────────────────
function tmplShipped(p: {
  orderNumber: string
  productName: string
  trackingNumber: string
  carrier: string
  trackingUrl: string
}) {
  return {
    subject: `[Estelongy] Siparişin Kargoya Verildi — ${p.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#111;padding:0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="padding:24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff">
          <h1 style="margin:0;font-size:22px">🚚 Siparişin Yolda</h1>
          <p style="margin:6px 0 0;opacity:0.9">Sipariş No: <strong>${p.orderNumber}</strong></p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px"><strong>${p.productName}</strong> kargoya verildi.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;background:#f9fafb;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 14px;color:#6b7280">Kargo Firması</td><td style="padding:10px 14px;text-align:right;font-weight:600">${p.carrier}</td></tr>
            <tr><td style="padding:10px 14px;color:#6b7280;border-top:1px solid #e5e7eb">Takip No</td><td style="padding:10px 14px;text-align:right;font-family:monospace;font-weight:700;border-top:1px solid #e5e7eb">${p.trackingNumber}</td></tr>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="${p.trackingUrl}" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Siparişi Görüntüle</a>
          </div>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center">14 gün cayma hakkın saklıdır. Soru için: destek@estelongy.com</p>
        </div>
      </div>
    `,
  }
}

function smsShipped(p: { orderNumber: string; carrier: string; trackingNumber: string }) {
  // Max 155 karakter — Türkçe karaktersiz
  return `Estelongy: ${p.orderNumber} siparisin ${p.carrier} ile kargoya verildi. Takip: ${p.trackingNumber}. Detay: estelongy.com`
}

// ── Şablon: teslim edildi ────────────────────────────────────────────
function tmplDelivered(p: { orderNumber: string; productName: string; trackingUrl: string }) {
  return {
    subject: `[Estelongy] Siparişin Teslim Edildi — ${p.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#111;padding:0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="padding:24px;background:linear-gradient(135deg,#10876B,#0e8f6e);color:#fff">
          <h1 style="margin:0;font-size:22px">✓ Siparişin Teslim Edildi</h1>
          <p style="margin:6px 0 0;opacity:0.9">Sipariş No: <strong>${p.orderNumber}</strong></p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px"><strong>${p.productName}</strong> teslim edildi.</p>
          <p style="margin:0 0 16px;color:#4b5563">14 gün içinde cayma hakkını kullanabilirsin. Memnun kalmadıysan veya hata varsa, sipariş ekranından iade talebi oluşturabilirsin.</p>
          <div style="margin-top:24px;text-align:center">
            <a href="${p.trackingUrl}" style="display:inline-block;padding:12px 32px;background:#10876B;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Siparişi Görüntüle</a>
          </div>
        </div>
      </div>
    `,
  }
}

function smsDelivered(p: { orderNumber: string }) {
  return `Estelongy: ${p.orderNumber} siparisin teslim edildi. 14 gun icinde iade hakkin var. Detay: estelongy.com`
}

// ── Şablon: iade kararı ──────────────────────────────────────────────
function tmplReturnDecision(p: {
  orderNumber: string
  productName: string
  decision: 'approved' | 'rejected'
  trackingUrl: string
  vendorNote?: string | null
}) {
  const ok = p.decision === 'approved'
  return {
    subject: ok
      ? `[Estelongy] İade Talebin Onaylandı — ${p.orderNumber}`
      : `[Estelongy] İade Talebin Reddedildi — ${p.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#111;padding:0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="padding:24px;background:${ok ? 'linear-gradient(135deg,#10876B,#0e8f6e)' : 'linear-gradient(135deg,#dc2626,#ef4444)'};color:#fff">
          <h1 style="margin:0;font-size:22px">${ok ? '✓ İade Onaylandı' : '✕ İade Reddedildi'}</h1>
          <p style="margin:6px 0 0;opacity:0.9">Sipariş: <strong>${p.orderNumber}</strong></p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px"><strong>${p.productName}</strong> için iade talebin <strong>${ok ? 'onaylandı' : 'reddedildi'}</strong>.</p>
          ${ok
            ? '<p style="margin:0 0 16px;color:#4b5563">Para iadesi Stripe üzerinden başlatıldı. Kartına 3-10 iş günü içinde yansıyacak.</p>'
            : `<p style="margin:0 0 16px;color:#4b5563">İş Ortağı talebini reddetti.${p.vendorNote ? ' Açıklama: ' + p.vendorNote : ''} İtirazın varsa destek ekibiyle iletişime geç.</p>`}
          <div style="margin-top:20px;text-align:center">
            <a href="${p.trackingUrl}" style="display:inline-block;padding:12px 32px;background:${ok ? '#10876B' : '#0F172A'};color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Detayı Gör</a>
          </div>
        </div>
      </div>
    `,
  }
}

// ── Şablon: satıcıya yeni sipariş ────────────────────────────────────
function tmplVendorNewOrder(p: {
  orderNumber: string
  vendorName: string
  itemsCount: number
  totalAmount: number
}) {
  return {
    subject: `[Estelongy] Yeni Sipariş — ${p.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#111;padding:0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="padding:24px;background:linear-gradient(135deg,#C9A961,#B8964F);color:#0F172A">
          <h1 style="margin:0;font-size:22px">📦 Yeni Sipariş Geldi</h1>
          <p style="margin:6px 0 0">Sipariş No: <strong>${p.orderNumber}</strong></p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 8px">Merhaba <strong>${p.vendorName}</strong>,</p>
          <p style="margin:0 0 16px;color:#4b5563">${p.itemsCount} kalem ürün için yeni siparişin var. Tutar: <strong>₺${p.totalAmount.toLocaleString('tr-TR')}</strong></p>
          <p style="margin:0 0 16px;color:#4b5563">Lütfen siparişi 24 saat içinde hazırlayıp kargoya verecek şekilde işlemeye başla.</p>
          <div style="margin-top:20px;text-align:center">
            <a href="${baseUrl()}/satici/panel/siparisler" style="display:inline-block;padding:12px 32px;background:#0F172A;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Panele Git →</a>
          </div>
        </div>
      </div>
    `,
  }
}

// ── Tetikleyiciler ────────────────────────────────────────────────────

type OrderRow = {
  id: string
  order_number: string
  user_id: string | null
  is_guest: boolean | null
  guest_email: string | null
  guest_phone: string | null
  address_snapshot: { phone?: string; full_name?: string } | null
}

export async function notifyOrderShipped(orderItemId: string): Promise<void> {
  try {
    const admin = createServiceClient()
    const { data: item } = await admin
      .from('order_items')
      .select('id, tracking_number, tracking_carrier, product_snapshot, order_id')
      .eq('id', orderItemId)
      .single()
    if (!item || !item.tracking_number) return

    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, user_id, is_guest, guest_email, guest_phone, address_snapshot')
      .eq('id', item.order_id)
      .single()
    if (!order) return

    const o = order as OrderRow
    const url = trackingUrlForOrder(o)
    const snap = (item.product_snapshot ?? {}) as { name?: string }
    const productName = snap.name ?? 'Ürün'

    // Email
    const email = await resolveBuyerEmail(admin, o)
    if (email) {
      const t = tmplShipped({
        orderNumber: o.order_number,
        productName,
        trackingNumber: item.tracking_number as string,
        carrier: (item.tracking_carrier as string) ?? '',
        trackingUrl: url,
      })
      await sendEmail(email, t.subject, t.html)
    }

    // SMS
    const phone = buyerPhoneOf(o)
    if (phone) {
      await sendInfoSms(phone, smsShipped({
        orderNumber: o.order_number,
        carrier: (item.tracking_carrier as string) ?? '',
        trackingNumber: item.tracking_number as string,
      }))
    }
  } catch (e) {
    console.error('[order-notifications] shipped exception:', e)
  }
}

export async function notifyOrderDelivered(orderItemId: string): Promise<void> {
  try {
    const admin = createServiceClient()
    const { data: item } = await admin
      .from('order_items')
      .select('id, product_snapshot, order_id')
      .eq('id', orderItemId)
      .single()
    if (!item) return

    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, user_id, is_guest, guest_email, guest_phone, address_snapshot')
      .eq('id', item.order_id)
      .single()
    if (!order) return

    const o = order as OrderRow
    const url = trackingUrlForOrder(o)
    const snap = (item.product_snapshot ?? {}) as { name?: string }
    const productName = snap.name ?? 'Ürün'

    const email = await resolveBuyerEmail(admin, o)
    if (email) {
      const t = tmplDelivered({ orderNumber: o.order_number, productName, trackingUrl: url })
      await sendEmail(email, t.subject, t.html)
    }

    const phone = buyerPhoneOf(o)
    if (phone) {
      await sendInfoSms(phone, smsDelivered({ orderNumber: o.order_number }))
    }
  } catch (e) {
    console.error('[order-notifications] delivered exception:', e)
  }
}

export async function notifyReturnDecision(returnId: string): Promise<void> {
  try {
    const admin = createServiceClient()
    const { data: ret } = await admin
      .from('returns')
      .select('id, status, resolver_note, order_item_id')
      .eq('id', returnId)
      .single()
    // 'approved' veya 'completed' (refund başarılı) ya da 'rejected' karar sonrası bildir.
    if (!ret || !['approved', 'completed', 'rejected'].includes(ret.status)) return
    const decision: 'approved' | 'rejected' = ret.status === 'rejected' ? 'rejected' : 'approved'

    const { data: item } = await admin
      .from('order_items')
      .select('id, product_snapshot, order_id')
      .eq('id', ret.order_item_id)
      .single()
    if (!item) return

    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, user_id, is_guest, guest_email, guest_phone, address_snapshot')
      .eq('id', item.order_id)
      .single()
    if (!order) return

    const o = order as OrderRow
    const url = trackingUrlForOrder(o)
    const snap = (item.product_snapshot ?? {}) as { name?: string }
    const productName = snap.name ?? 'Ürün'

    const email = await resolveBuyerEmail(admin, o)
    if (email) {
      const t = tmplReturnDecision({
        orderNumber: o.order_number,
        productName,
        decision,
        trackingUrl: url,
        vendorNote: (ret.resolver_note as string | null) ?? null,
      })
      await sendEmail(email, t.subject, t.html)
    }
  } catch (e) {
    console.error('[order-notifications] return-decision exception:', e)
  }
}

export async function notifyVendorNewOrder(orderId: string): Promise<void> {
  try {
    const admin = createServiceClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, total, total_amount, order_items(id, vendor_id, vendors(user_id, company_name))')
      .eq('id', orderId)
      .single()
    if (!order) return

    type LineWithVendor = {
      id: string
      vendor_id: string | null
      vendors: { user_id: string; company_name: string } | null
    }
    const lines = (order.order_items ?? []) as unknown as LineWithVendor[]

    // Vendor başına grupla → her vendor için tek mail
    const byVendor = new Map<string, { userId: string; companyName: string; itemsCount: number }>()
    for (const l of lines) {
      if (!l.vendors || !l.vendor_id) continue
      const existing = byVendor.get(l.vendor_id)
      if (existing) {
        existing.itemsCount += 1
      } else {
        byVendor.set(l.vendor_id, {
          userId: l.vendors.user_id,
          companyName: l.vendors.company_name,
          itemsCount: 1,
        })
      }
    }

    for (const v of byVendor.values()) {
      const { data: userData } = await admin.auth.admin.getUserById(v.userId)
      const email = userData?.user?.email
      if (!email) continue
      const t = tmplVendorNewOrder({
        orderNumber: order.order_number as string,
        vendorName: v.companyName,
        itemsCount: v.itemsCount,
        totalAmount: Number(order.total ?? order.total_amount ?? 0),
      })
      await sendEmail(email, t.subject, t.html)
    }
  } catch (e) {
    console.error('[order-notifications] vendor-new-order exception:', e)
  }
}
