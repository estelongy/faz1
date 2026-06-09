export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import SiparisKartlari from './SiparisKartlari'
import { getServerFlavor } from '@/lib/server-flavor'
import SiparislerAppView from '@/components/satici-panel/SiparislerAppView'

export const metadata: Metadata = { title: 'Siparişlerim — İş Ortağı' }

export default async function SaticiSiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>
}) {
  const { durum } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  let query = supabase
    .from('order_items')
    .select('*, orders!inner(order_number, payment_status, paid_at, address_snapshot, user_id, profiles(full_name))')
    .eq('vendor_id', vendor.id)
    .eq('orders.payment_status', 'paid')
    .order('created_at', { ascending: false })

  if (durum && ['pending','preparing','shipped','delivered','cancelled','returned'].includes(durum)) {
    query = query.eq('fulfillment_status', durum)
  }

  const { data: items } = await query.limit(100)

  // Kargo ayarları var mı? Etiket butonu için gerekli.
  // default_carrier + preferred_carriers da getir — etiket basarken vendor
  // anlaştığı şirketler arasından seçim yapsın (Aras + Sürat ikisiyle de
  // anlaşmış olabilir, bu sipariş için Sürat istiyor).
  const { data: shippingSettings } = await supabase
    .from('vendor_shipping_settings')
    .select('vendor_id, default_carrier, preferred_carriers, sender_email, sender_postal_code')
    .eq('vendor_id', vendor.id)
    .maybeSingle()
  const hasShippingSettings =
    !!shippingSettings && !!shippingSettings.sender_email && !!shippingSettings.sender_postal_code
  // Vendor'a "neyin eksik olduğunu" söyle — "ayarlar yok" değil de "şu alan eksik".
  let shippingHint: string | null = null
  if (!shippingSettings) {
    shippingHint = 'Kargo ayarların hiç oluşturulmamış. Tek tıkla etiket üretmek için doldur.'
  } else {
    const missing: string[] = []
    if (!shippingSettings.sender_email) missing.push('gönderici e-posta')
    if (!shippingSettings.sender_postal_code) missing.push('posta kodu')
    if (missing.length > 0) {
      shippingHint = `Kargo ayarlarında ${missing.join(' ve ')} eksik — etiket basamazsın.`
    }
  }
  const defaultCarrier = shippingSettings?.default_carrier ?? 'Yurtiçi Kargo'
  const preferredCarriers: string[] = (shippingSettings?.preferred_carriers as string[] | null) ?? [defaultCarrier]

  const statusCounts = {
    pending:    0,
    preparing:  0,
    shipped:    0,
    delivered:  0,
  }
  // Sayım liste sorgusu ile AYNI kapsama sahip olmalı (paid sipariş).
  // Aksi halde tab'da count görünür ama tıklayınca liste boş çıkar.
  const { data: counts } = await supabase
    .from('order_items')
    .select('fulfillment_status, orders!inner(payment_status)')
    .eq('vendor_id', vendor.id)
    .eq('orders.payment_status', 'paid')
  if (counts) {
    for (const c of counts) {
      const s = c.fulfillment_status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    }
  }

  const flavor = await getServerFlavor()
  if (flavor === 'estestorepro') {
    return (
      <SiparislerAppView
        companyName={vendor.company_name ?? 'İş Ortağı'}
        items={(items ?? []) as unknown as Parameters<typeof SiparislerAppView>[0]['items']}
        hasShippingSettings={hasShippingSettings}
        shippingHint={shippingHint}
        defaultCarrier={defaultCarrier}
        preferredCarriers={preferredCarriers}
        durum={durum}
        statusCounts={statusCounts}
      />
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-4 pt-16 lg:pt-10 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Siparişlerim</h1>
          <p className="text-slate-400 text-sm mt-1">{vendor.company_name}</p>
        </div>

        {/* Durum filtreleri */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/satici/panel/siparisler"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!durum ? 'bg-[#C9A961] text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            Tümü
          </Link>
          {[
            { key: 'pending',   label: 'Bekleyen',    count: statusCounts.pending,   color: 'amber' },
            { key: 'preparing', label: 'Hazırlıkta',  count: statusCounts.preparing, color: 'blue' },
            { key: 'shipped',   label: 'Kargoda',     count: statusCounts.shipped,   color: 'violet' },
            { key: 'delivered', label: 'Teslim',      count: statusCounts.delivered, color: 'emerald' },
          ].map(f => (
            <Link key={f.key} href={`/satici/panel/siparisler?durum=${f.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${durum === f.key ? 'bg-[#C9A961] text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
            </Link>
          ))}
        </div>

        {/* Kartlar */}
        {items && items.length > 0 ? (
          <SiparisKartlari
            items={items}
            hasShippingSettings={hasShippingSettings}
            shippingHint={shippingHint}
            defaultCarrier={defaultCarrier}
            preferredCarriers={preferredCarriers}
          />
        ) : (
          <div className="text-center py-24 text-slate-600">
            <div className="text-5xl mb-4">📦</div>
            <p>Bu filtreye uyan sipariş yok</p>
          </div>
        )}
      </div>
    </main>
  )
}
