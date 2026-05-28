'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ReviewResponseResult = { ok: true } | { ok: false; error: string }

export async function respondToReviewAction(
  reviewId: string,
  response: string,
): Promise<ReviewResponseResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const r = (response ?? '').trim()
  if (r.length < 1)    return { ok: false, error: 'Yanıt boş olamaz.' }
  if (r.length > 1500) return { ok: false, error: 'Yanıt çok uzun (maks 1500).' }

  const { error } = await supabase
    .from('reviews')
    .update({
      vendor_response:      r,
      vendor_responded_at:  new Date().toISOString(),
      vendor_responded_by:  user.id,
    })
    .eq('id', reviewId)
    // RLS zaten sahiplik kontrolünü yapıyor

  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel/yorumlar')
  return { ok: true }
}

export async function clearReviewResponseAction(reviewId: string): Promise<ReviewResponseResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { error } = await supabase
    .from('reviews')
    .update({
      vendor_response: null,
      vendor_responded_at: null,
      vendor_responded_by: null,
    })
    .eq('id', reviewId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/satici/panel/yorumlar')
  return { ok: true }
}
