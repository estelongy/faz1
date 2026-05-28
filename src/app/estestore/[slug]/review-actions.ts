'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface EpReviewSubmitInput {
  productId: string
  qEtkinlik:    number  // 1-5
  qSosyalKanit: number  // 1-5
  qGuvenlik:    number  // 1-5
  qEtkiSuresi:  number  // 1-5
  qKullanim:    number  // 1-5
  title?: string
  comment?: string
}

export type EpReviewSubmitResult =
  | { ok: true; isVerified: boolean }
  | { ok: false; error: string }

function in1to5(n: unknown): boolean {
  const x = Number(n)
  return Number.isFinite(x) && x >= 1 && x <= 5
}

export async function submitReviewAction(
  input: EpReviewSubmitInput,
): Promise<EpReviewSubmitResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  if (![input.qEtkinlik, input.qSosyalKanit, input.qGuvenlik, input.qEtkiSuresi, input.qKullanim].every(in1to5)) {
    return { ok: false, error: 'Tüm başlıklarda 1-5 arası puan ver.' }
  }

  // ── Satın alma doğrulama ──────────────────────────────────────
  const { data: purchaseRow } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id, payment_status)')
    .eq('product_id', input.productId)
    .eq('orders.user_id', user.id)
    .eq('orders.payment_status', 'paid')
    .limit(1)
    .maybeSingle()

  const isVerified = !!purchaseRow

  // ── baz_score: 5 başlık ortalaması × 2 → 1-10 ölçeği ───────────
  const avg5 = (input.qEtkinlik + input.qSosyalKanit + input.qGuvenlik + input.qEtkiSuresi + input.qKullanim) / 5
  const bazScore = Math.round(avg5 * 2 * 10) / 10  // ör: 4.2 → 8.4

  // ── Upsert (product_id + user_id unique) ──────────────────────
  const { error: upErr } = await supabase
    .from('ep_reviews')
    .upsert({
      product_id:             input.productId,
      user_id:                user.id,
      q_etkinlik:             input.qEtkinlik,
      q_sosyal_kanit:         input.qSosyalKanit,
      q_guvenlik:             input.qGuvenlik,
      q_etki_suresi:          input.qEtkiSuresi,
      q_kullanim:             input.qKullanim,
      baz_score:              bazScore,
      title:                  input.title?.trim()?.slice(0, 120) || null,
      comment:                input.comment?.trim()?.slice(0, 1000) || null,
      is_verified_purchase:   isVerified,
    }, { onConflict: 'product_id,user_id' })

  if (upErr) return { ok: false, error: upErr.message }

  // ── user_score güncellemesi ───────────────────────────────────
  const { data: allEpReviews } = await supabase
    .from('ep_reviews')
    .select('baz_score')
    .eq('product_id', input.productId)
    .not('baz_score', 'is', null)

  if (allEpReviews && allEpReviews.length > 0) {
    const avg = allEpReviews.reduce((s, r) => s + Number(r.baz_score ?? 0), 0) / allEpReviews.length
    await supabase
      .from('products')
      .update({ user_score: Math.round(avg * 10) / 10 })
      .eq('id', input.productId)
  }

  revalidatePath('/estestore')
  revalidatePath(`/estestore/${input.productId}`)
  return { ok: true, isVerified }
}

/** Kullanıcı kendi yorumunu silsin */
export async function deleteOwnReviewAction(productId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  const { error } = await supabase
    .from('ep_reviews')
    .delete()
    .eq('product_id', productId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/estestore/${productId}`)
  return { ok: true }
}
