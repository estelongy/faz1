/**
 * Vendor dashboard analitik helper'ı.
 *
 * Tüm metricleri tek query'den hesaplar — page'lerde duplikasyonu önler.
 * Server-only: import edenler 'use server' veya server component olmalı.
 */

import { createServiceClient } from '@/lib/supabase/service'

export interface MonthlyBucket {
  /** YYYY-MM */
  ym: string
  count: number
  gross: number
  net: number
  commission: number
}

export interface TopProduct {
  productId: string
  name: string
  image: string | null
  quantity: number
  gross: number
}

export interface VendorStats {
  /** Bu takvim ayının metricleri */
  thisMonth: { count: number; gross: number; net: number }
  /** Geçen takvim ayının metricleri */
  lastMonth: { count: number; gross: number; net: number }
  /** Değişim yüzdesi (geçen aya göre ciro). lastMonth.gross 0 ise null. */
  grossChangePct: number | null
  /** Son 12 ay (eski → yeni sıralı, eksik aylar dolu 0 ile) */
  last12Months: MonthlyBucket[]
  /** Tüm zamanlar en çok satan ilk 5 ürün */
  topProducts: TopProduct[]
  /** Bekleyen sipariş kalem sayısı (fulfillment_status pending/preparing) */
  pendingItems: number
  /** Kargolanan ama henüz teslim edilmeyen */
  shippedItems: number
}

function ymOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function addMonths(d: Date, n: number): Date {
  const nd = new Date(d)
  nd.setMonth(nd.getMonth() + n)
  return nd
}

export async function getVendorStats(vendorId: string): Promise<VendorStats> {
  const admin = createServiceClient()

  // 1) Tüm ödenmiş kalemler (commission, gross, payout, status, product_snapshot, paid_at)
  const { data: items } = await admin
    .from('order_items')
    .select(`
      id, product_id, quantity, line_total, commission_amount, vendor_payout,
      fulfillment_status, created_at, product_snapshot,
      orders!inner(payment_status, paid_at)
    `)
    .eq('vendor_id', vendorId)
    .eq('orders.payment_status', 'paid')
    .limit(5000)

  type Row = {
    id: string
    product_id: string
    quantity: number
    line_total: number | string
    commission_amount: number | string
    vendor_payout: number | string
    fulfillment_status: string
    created_at: string
    product_snapshot: { name?: string; image?: string } | null
    orders: { payment_status: string; paid_at: string | null } | { payment_status: string; paid_at: string | null }[]
  }
  const lines = (items ?? []) as unknown as Row[]

  const now = new Date()
  const thisYm = ymOf(now)
  const lastYm = ymOf(addMonths(now, -1))

  // 2) Aylık gruplama
  const monthly = new Map<string, MonthlyBucket>()
  // Son 12 ay key seedle (eksik ay → 0)
  for (let i = 11; i >= 0; i--) {
    const ym = ymOf(addMonths(now, -i))
    monthly.set(ym, { ym, count: 0, gross: 0, net: 0, commission: 0 })
  }

  let pendingItems = 0
  let shippedItems = 0

  // Top ürünler birikim
  const productTotals = new Map<string, TopProduct>()

  for (const l of lines) {
    const o = Array.isArray(l.orders) ? l.orders[0] : l.orders
    const date = o?.paid_at ?? l.created_at
    const ym = date.slice(0, 7)
    const gross = Number(l.line_total)
    const net = Number(l.vendor_payout)
    const commission = Number(l.commission_amount)

    if (monthly.has(ym)) {
      const m = monthly.get(ym)!
      m.count += 1
      m.gross += gross
      m.net += net
      m.commission += commission
    }

    // Top ürünler
    if (l.product_id) {
      const snap = l.product_snapshot ?? {}
      const existing = productTotals.get(l.product_id)
      if (existing) {
        existing.quantity += l.quantity
        existing.gross += gross
      } else {
        productTotals.set(l.product_id, {
          productId: l.product_id,
          name: snap.name ?? 'Ürün',
          image: snap.image ?? null,
          quantity: l.quantity,
          gross,
        })
      }
    }

    // Fulfillment sayımları (sadece bu ürünün vendor'ına ait sipariş kalemleri)
    if (l.fulfillment_status === 'pending' || l.fulfillment_status === 'preparing') {
      pendingItems += 1
    } else if (l.fulfillment_status === 'shipped') {
      shippedItems += 1
    }
  }

  const last12Months = Array.from(monthly.values()) // insertion order = eskiden yeniye
  const thisMonth = monthly.get(thisYm) ?? { ym: thisYm, count: 0, gross: 0, net: 0, commission: 0 }
  const lastMonth = monthly.get(lastYm) ?? { ym: lastYm, count: 0, gross: 0, net: 0, commission: 0 }

  const grossChangePct = lastMonth.gross > 0
    ? Math.round(((thisMonth.gross - lastMonth.gross) / lastMonth.gross) * 100)
    : null

  // Top 5 ürün ciroya göre azalan
  const topProducts = Array.from(productTotals.values())
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 5)

  return {
    thisMonth: { count: thisMonth.count, gross: thisMonth.gross, net: thisMonth.net },
    lastMonth: { count: lastMonth.count, gross: lastMonth.gross, net: lastMonth.net },
    grossChangePct,
    last12Months,
    topProducts,
    pendingItems,
    shippedItems,
  }
}
