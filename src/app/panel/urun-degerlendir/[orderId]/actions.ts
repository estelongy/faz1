'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface EpReviewPayload {
  productId: string
  qEtkinlik: number
  qSosyalKanit: number
  qGuvenlik: number
  qEtkiSuresi: number
  qKullanim: number
}

export async function submitEpReview(
  orderId: string,
  reviews: EpReviewPayload[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum açık değil' }

  // Sipariş sahibi mi?
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, user_id')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!order) return { ok: false, error: 'Sipariş bulunamadı' }
  if (order.status !== 'delivered') return { ok: false, error: 'Sipariş henüz teslim edilmedi' }

  for (const r of reviews) {
    const { error } = await supabase
      .from('ep_reviews')
      .upsert({
        product_id: r.productId,
        user_id: user.id,
        q_etkinlik: r.qEtkinlik,
        q_sosyal_kanit: r.qSosyalKanit,
        q_guvenlik: r.qGuvenlik,
        q_etki_suresi: r.qEtkiSuresi,
        q_kullanim: r.qKullanim,
      }, { onConflict: 'product_id,user_id' })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/panel/siparislerim')
  revalidatePath(`/panel/urun-degerlendir/${orderId}`)
  return { ok: true }
}
