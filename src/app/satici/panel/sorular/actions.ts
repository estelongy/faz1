'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AnswerResult = { ok: true } | { ok: false; error: string }

export async function answerQuestionAction(
  questionId: string,
  answer: string,
): Promise<AnswerResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const a = (answer ?? '').trim()
  if (a.length < 1)    return { ok: false, error: 'Cevap boş olamaz.' }
  if (a.length > 1500) return { ok: false, error: 'Cevap çok uzun (maks 1500).' }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false, error: 'Satıcı kaydı bulunamadı.' }

  const { error } = await supabase
    .from('product_questions')
    .update({
      answer: a,
      answered_at: new Date().toISOString(),
      answered_by_user_id: user.id,
    })
    .eq('id', questionId)
    .eq('vendor_id', vendor.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel/sorular')
  return { ok: true }
}

export async function hideQuestionAction(questionId: string, hide: boolean): Promise<AnswerResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false, error: 'Satıcı kaydı bulunamadı.' }

  const { error } = await supabase
    .from('product_questions')
    .update({ is_hidden: hide })
    .eq('id', questionId)
    .eq('vendor_id', vendor.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/satici/panel/sorular')
  return { ok: true }
}
