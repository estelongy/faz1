export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import EtiketLabel from '../EtiketLabel'

export const metadata: Metadata = { title: 'Kargo Etiketi', robots: { index: false } }

export default async function EtiketSayfasi({
  params,
}: {
  params: Promise<{ orderItemId: string }>
}) {
  const { orderItemId } = await params
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
  if (!settings) {
    redirect('/satici/panel/kargo?onboard=1')
  }

  const { data: item } = await supabase
    .from('order_items')
    .select(`
      id, product_snapshot, quantity, line_total,
      tracking_number, tracking_carrier, shipping_label_code,
      orders (
        order_number, address_snapshot, paid_at, total
      )
    `)
    .eq('id', orderItemId)
    .eq('vendor_id', vendor.id)
    .maybeSingle()

  if (!item) notFound()

  return (
    <EtiketLabel
      settings={settings}
      items={[{
        orderItemId: item.id,
        orderNumber: (item.orders as { order_number?: string } | null)?.order_number ?? '—',
        labelCode: item.shipping_label_code ?? item.tracking_number ?? '—',
        carrier: item.tracking_carrier ?? settings.default_carrier ?? 'Kargo',
        product: item.product_snapshot as { name?: string },
        quantity: item.quantity,
        address: (item.orders as { address_snapshot?: Record<string, string> } | null)?.address_snapshot ?? {},
      }]}
    />
  )
}
