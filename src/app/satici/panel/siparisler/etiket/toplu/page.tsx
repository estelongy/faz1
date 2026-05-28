export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import EtiketLabel from '../EtiketLabel'

export const metadata: Metadata = { title: 'Toplu Kargo Etiketi', robots: { index: false } }

export default async function TopluEtiketSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()
  if (!vendor) notFound()

  const { data: settings } = await supabase
    .from('vendor_shipping_settings')
    .select('*')
    .eq('vendor_id', vendor.id)
    .maybeSingle()
  if (!settings) redirect('/satici/panel/kargo?onboard=1')

  const sp = await searchParams
  const ids = (sp.ids ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 50)

  if (ids.length === 0) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Etiket için sipariş seçilmedi</h1>
          <p className="text-slate-500 mt-2">/satici/panel/siparisler sayfasından sipariş seçip toplu etiket oluştur.</p>
        </div>
      </main>
    )
  }

  const { data: items } = await supabase
    .from('order_items')
    .select(`
      id, product_snapshot, quantity, line_total,
      tracking_number, tracking_carrier, shipping_label_code,
      orders ( order_number, address_snapshot, paid_at, total )
    `)
    .in('id', ids)
    .eq('vendor_id', vendor.id)

  const labelItems = (items ?? []).map(it => ({
    orderItemId: it.id,
    orderNumber: (it.orders as { order_number?: string } | null)?.order_number ?? '—',
    labelCode: it.shipping_label_code ?? it.tracking_number ?? '—',
    carrier: it.tracking_carrier ?? settings.default_carrier ?? 'Kargo',
    product: it.product_snapshot as { name?: string },
    quantity: it.quantity,
    address: (it.orders as { address_snapshot?: Record<string, string> } | null)?.address_snapshot ?? {},
  }))

  return <EtiketLabel settings={settings} items={labelItems} />
}
