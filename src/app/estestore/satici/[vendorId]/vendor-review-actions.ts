'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type VendorReviewResult =
  | { ok: true }
  | { ok: false; error: string }

export async function upsertVendorReviewAction(
  vendorId: string,
  rating: number,
  title: string,
  body: string,
): Promise<VendorReviewResult> {
  if (!vendorId) return { ok: false, error: 'Satıcı bulunamadı.' }
  const r = Math.round(Number(rating))
  if (!Number.isFinite(r) || r < 1 || r > 5) return { ok: false, error: 'Puan 1-5 arası olmalı.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  const cleanTitle = (title ?? '').trim().slice(0, 120) || null
  const cleanBody = (body ?? '').trim().slice(0, 1000) || null

  // Upsert by (vendor_id, user_id)
  const { error } = await supabase
    .from('vendor_reviews')
    .upsert(
      {
        vendor_id: vendorId,
        user_id: user.id,
        rating: r,
        title: cleanTitle,
        body: cleanBody,
      },
      { onConflict: 'vendor_id,user_id' },
    )

  if (error) {
    // RLS başarısız olabilir — satın alma yoksa
    if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
      return { ok: false, error: 'Sadece bu satıcıdan sipariş veren müşteriler puanlayabilir.' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/estestore/satici/${vendorId}`)
  return { ok: true }
}

export async function deleteVendorReviewAction(vendorId: string): Promise<VendorReviewResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  const { error } = await supabase
    .from('vendor_reviews')
    .delete()
    .eq('vendor_id', vendorId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/estestore/satici/${vendorId}`)
  return { ok: true }
}
