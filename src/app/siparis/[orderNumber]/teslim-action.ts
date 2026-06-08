'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Müşteri "Teslim Aldım" tıklar → seçilen order_items'ları delivered'a çeker.
 * RPC `mark_order_items_delivered_by_customer` owner check + status guard yapar.
 *
 * NOT: Müşteriye notifyOrderDelivered çağırılmaz — kendi "aldım" dediği için
 * "teslim edildi" SMS/email çift bildirim olurdu. Vendor'a "müşteri teslimi
 * onayladı" bildirimi ayrı iş (b1_eksikler).
 */
export async function teslimAldimAction(
  orderItemIds: string[],
  orderNumber: string,
): Promise<{ ok: boolean; error?: string; updated?: string[] }> {
  if (!Array.isArray(orderItemIds) || orderItemIds.length === 0) {
    return { ok: false, error: 'Hiç sipariş kalemi seçilmedi.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş gerekli.' }

  const { data, error } = await supabase.rpc('mark_order_items_delivered_by_customer', {
    p_order_item_ids: orderItemIds,
  })

  if (error) return { ok: false, error: error.message }

  const updated = Array.isArray(data) ? (data as string[]) : []
  if (updated.length === 0) {
    return { ok: false, error: 'Bu kalemler için teslim onayı uygulanamadı (kargoya verilmemiş ya da zaten teslim olmuş olabilir).' }
  }

  revalidatePath(`/siparis/${orderNumber}`)
  revalidatePath('/panel/siparislerim')
  return { ok: true, updated }
}
