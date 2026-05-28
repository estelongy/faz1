'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { notifyOrderShipped, notifyOrderDelivered } from '@/lib/order-notifications'

async function getVendor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') {
    return { ok: false as const, error: 'Yetkisiz' }
  }
  return { ok: true as const, supabase, vendor }
}

export async function kargoGuncelleAction(
  orderItemId: string,
  trackingNumber: string,
  carrier: string
): Promise<{ ok: boolean; error?: string }> {
  const r = await getVendor()
  if (!r.ok) return { ok: false, error: r.error }
  const { supabase, vendor } = r

  if (!trackingNumber.trim()) return { ok: false, error: 'Takip numarası gerekli' }

  const { error } = await supabase
    .from('order_items')
    .update({
      fulfillment_status: 'shipped',
      tracking_number:    trackingNumber.trim(),
      tracking_carrier:   carrier,
      shipped_at:         new Date().toISOString(),
    })
    .eq('id', orderItemId)
    .eq('vendor_id', vendor.id)

  if (error) return { ok: false, error: error.message }

  // Müşteriye email + SMS bildirim — fire-and-forget, hata UI'yı bloklamaz.
  void notifyOrderShipped(orderItemId)

  revalidatePath('/satici/panel/siparisler')
  return { ok: true }
}

/**
 * Tek tıkla kargo etiketi oluştur. Internal Estelongy kodu üretir (EST-YY-XXXXXX),
 * tracking_number alanına kaydeder, status='shipped'e geçer, müşteriye bildirim atar.
 *
 * Eğer vendor'un shipping settings'i yoksa hata döner (önce ayarları doldursun).
 */
export async function etiketOlusturAction(
  orderItemIds: string[],
  carrier?: string,
): Promise<{ ok: boolean; error?: string; labels?: Array<{ orderItemId: string; code: string }> }> {
  const r = await getVendor()
  if (!r.ok) return { ok: false, error: r.error }
  const { supabase, vendor } = r

  if (!Array.isArray(orderItemIds) || orderItemIds.length === 0) {
    return { ok: false, error: 'Etiket için sipariş seçilmedi.' }
  }

  // Vendor kargo ayarları zorunlu
  const { data: settings } = await supabase
    .from('vendor_shipping_settings')
    .select('default_carrier')
    .eq('vendor_id', vendor.id)
    .maybeSingle()

  if (!settings) {
    return { ok: false, error: 'Önce kargo ayarlarını doldurmalısın: /satici/panel/kargo' }
  }

  const finalCarrier = carrier || settings.default_carrier || 'Yurtiçi Kargo'
  const generated: Array<{ orderItemId: string; code: string }> = []

  for (const id of orderItemIds) {
    // RPC ile atomik kod üret
    const { data: codeData, error: codeErr } = await supabase.rpc('generate_shipping_label_code')
    if (codeErr || !codeData) {
      return { ok: false, error: `Etiket kodu üretilemedi: ${codeErr?.message ?? 'unknown'}` }
    }
    const code = String(codeData)

    const { error: updErr } = await supabase
      .from('order_items')
      .update({
        fulfillment_status:           'shipped',
        tracking_number:              code,
        tracking_carrier:             finalCarrier,
        shipped_at:                   new Date().toISOString(),
        shipping_label_code:          code,
        shipping_label_generated_at:  new Date().toISOString(),
      })
      .eq('id', id)
      .eq('vendor_id', vendor.id)

    if (updErr) {
      return { ok: false, error: `Sipariş güncellenemedi: ${updErr.message}` }
    }

    generated.push({ orderItemId: id, code })

    // Müşteri bildirimi (fire-and-forget)
    void notifyOrderShipped(id)
  }

  revalidatePath('/satici/panel/siparisler')
  return { ok: true, labels: generated }
}

export async function fulfillmentGuncelleAction(
  orderItemId: string,
  status: 'preparing' | 'delivered' | 'cancelled'
): Promise<{ ok: boolean; error?: string }> {
  const r = await getVendor()
  if (!r.ok) return { ok: false, error: r.error }
  const { supabase, vendor } = r

  const patch: Record<string, unknown> = { fulfillment_status: status }
  if (status === 'delivered') patch.delivered_at = new Date().toISOString()

  const { error } = await supabase
    .from('order_items')
    .update(patch)
    .eq('id', orderItemId)
    .eq('vendor_id', vendor.id)

  if (error) return { ok: false, error: error.message }

  // 'delivered' geçişinde müşteriye email + SMS — fire-and-forget.
  if (status === 'delivered') {
    void notifyOrderDelivered(orderItemId)
  }

  revalidatePath('/satici/panel/siparisler')
  return { ok: true }
}
