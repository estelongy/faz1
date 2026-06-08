'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyVendorNewQuestion } from '@/lib/order-notifications'

export type QaResult =
  | { ok: true }
  | { ok: false; error: string }

export async function askQuestionAction(productId: string, question: string): Promise<QaResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  const q = (question ?? '').trim()
  if (q.length < 5)   return { ok: false, error: 'Soru en az 5 karakter olmalı.' }
  if (q.length > 800) return { ok: false, error: 'Soru çok uzun (maks 800).' }

  // Ürünün vendor_id'sini al
  const { data: product } = await supabase
    .from('products')
    .select('id, vendor_id, slug')
    .eq('id', productId)
    .single()
  if (!product) return { ok: false, error: 'Ürün bulunamadı.' }

  const { data: inserted, error } = await supabase
    .from('product_questions')
    .insert({
      product_id:    productId,
      vendor_id:     product.vendor_id,
      asker_user_id: user.id,
      question:      q,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  // Vendor'a yeni-soru bildirimi — fire-and-forget.
  if (inserted?.id) void notifyVendorNewQuestion(inserted.id as string)

  revalidatePath(`/estestore/${product.slug ?? product.id}`)
  revalidatePath('/satici/panel/sorular')
  return { ok: true }
}

export async function deleteQuestionAction(questionId: string): Promise<QaResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  const { error } = await supabase
    .from('product_questions')
    .delete()
    .eq('id', questionId)
    .eq('asker_user_id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
