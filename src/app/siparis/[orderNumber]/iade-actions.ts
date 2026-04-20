'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type IadeInput = {
  orderItemId: string
  reason: string
  description?: string
}

export async function iadeTalebiOlusturAction(input: IadeInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  if (!input.reason?.trim()) return { ok: false, error: 'İade sebebi zorunlu' }

  // Ownership + status kontrolü: fulfillment shipped/delivered olmalı
  const { data: item } = await supabase
    .from('order_items')
    .select('id, fulfillment_status, delivered_at, shipped_at, orders!inner(user_id, payment_status)')
    .eq('id', input.orderItemId)
    .single()

  const order = (item?.orders as unknown as { user_id: string; payment_status: string } | null)
  if (!item || !order || order.user_id !== user.id) {
    return { ok: false, error: 'Sipariş bulunamadı' }
  }
  if (order.payment_status !== 'paid') {
    return { ok: false, error: 'Ödenmemiş siparişin iadesi olmaz' }
  }
  if (!['shipped', 'delivered'].includes(item.fulfillment_status)) {
    return { ok: false, error: 'Kargoya verilmemiş ürünün iadesi için önce siparişi iptal etmelisin' }
  }

  // Mevcut aktif iade talebi var mı
  const { data: existing } = await supabase
    .from('returns')
    .select('id, status')
    .eq('order_item_id', input.orderItemId)
    .in('status', ['pending', 'approved'])
    .maybeSingle()
  if (existing) return { ok: false, error: 'Bu ürün için zaten bir iade talebin var' }

  const { data, error } = await supabase
    .from('returns')
    .insert({
      user_id: user.id,
      order_item_id: input.orderItemId,
      reason: input.reason.trim(),
      description: input.description?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/siparis')
  revalidatePath('/panel/iadelerim')
  return { ok: true, id: data.id }
}

export async function iadeIptalAction(returnId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { error } = await supabase
    .from('returns')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', returnId)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/iadelerim')
  return { ok: true }
}

// Satıcı: iade onayla / reddet
export async function iadeKararAction(
  returnId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  const isAdmin = role === 'admin'

  // İadeyi getir, yetki kontrol
  const { data: ret } = await supabase
    .from('returns')
    .select('id, status, order_item_id, order_items(vendor_id, line_total, vendors(user_id))')
    .eq('id', returnId)
    .single()
  if (!ret) return { ok: false, error: 'İade bulunamadı' }
  if (ret.status !== 'pending') return { ok: false, error: 'Bu iade zaten karara bağlanmış' }

  const item = ret.order_items as unknown as { vendor_id?: string; line_total?: number; vendors?: { user_id?: string } } | null
  const isOwnerVendor = item?.vendors?.user_id === user.id
  if (!isAdmin && !isOwnerVendor) return { ok: false, error: 'Yetkisiz' }

  const patch: Record<string, unknown> = {
    status: decision,
    resolver_id: user.id,
    resolver_type: isAdmin ? 'admin' : 'vendor',
    resolver_note: note?.trim() || null,
    resolved_at: new Date().toISOString(),
  }
  if (decision === 'approved') {
    patch.refund_amount = item?.line_total ?? null
  }

  const { error } = await supabase.from('returns').update(patch).eq('id', returnId)
  if (error) return { ok: false, error: error.message }

  // Onaylandıysa item'ı 'returned' işaretle (stok iadesi manuel veya otomatik iade flow'unda)
  if (decision === 'approved' && ret.order_item_id) {
    await supabase
      .from('order_items')
      .update({ fulfillment_status: 'returned' })
      .eq('id', ret.order_item_id)
  }

  revalidatePath('/satici/panel/siparisler')
  revalidatePath('/satici/panel/iadeler')
  revalidatePath('/admin/iadeler')
  revalidatePath('/panel/iadelerim')
  return { ok: true }
}
