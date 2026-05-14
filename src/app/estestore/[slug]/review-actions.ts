'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ReviewInput {
  productId: string
  rating: number
  title?: string
  body?: string
}

export async function submitReviewAction(
  input: ReviewInput
): Promise<{ ok: boolean; error?: string; isVerified?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısınız' }

  const rating = Number(input.rating)
  if (!rating || rating < 1 || rating > 10) return { ok: false, error: 'Geçersiz puan (1-10)' }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', input.productId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return { ok: false, error: 'Bu ürün için zaten yorum yaptınız' }

  // ── Satın alma doğrulama ─────────────────────────────────────
  const { data: purchaseRow } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id, payment_status)')
    .eq('product_id', input.productId)
    .in('fulfillment_status', ['delivered', 'returned'])
    .eq('orders.user_id', user.id)
    .eq('orders.payment_status', 'paid')
    .limit(1)
    .maybeSingle()

  const isVerified = !!purchaseRow

  const { error: insertErr } = await supabase.from('reviews').insert({
    product_id: input.productId,
    user_id:    user.id,
    rating,
    title:      input.title?.trim() || null,
    body:       input.body?.trim() || null,
    is_verified: isVerified,
  })
  if (insertErr) return { ok: false, error: insertErr.message }

  // ── user_score güncellemesi ──────────────────────────────────
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', input.productId)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + Number(r.rating), 0) / allReviews.length
    await supabase
      .from('products')
      .update({ user_score: Math.round(avg * 10) / 10 })
      .eq('id', input.productId)
  }

  revalidatePath('/estestore')
  revalidatePath(`/estestore/${input.productId}`)
  return { ok: true, isVerified }
}
