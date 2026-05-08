'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * Klinik özel mesajı okudu olarak işaretle.
 * Sadece klinik sahibi bu update'i yapabilir (RLS + manuel ownership check).
 */
export async function markPrivateReadAction(reviewId: string): Promise<ActionResult> {
  if (!reviewId) return { ok: false, error: 'reviewId eksik' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { error } = await supabase
    .from('clinic_reviews')
    .update({ private_read_at: new Date().toISOString() })
    .eq('id', reviewId)
    .eq('clinic_id', clinic.id)
    .is('private_read_at', null)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/mesajlar')
  return { ok: true }
}

/**
 * Klinik tek-seferlik özel cevap.
 * Sadece hasta `private_wants_reply = true` işaretlediyse anlamlı olur,
 * fakat klinik isterse yine de yanıt yazabilir (hasta kendi panelinde görür).
 */
export async function privateRespondAction(
  reviewId: string,
  response: string,
): Promise<ActionResult> {
  const text = (response ?? '').trim().slice(0, 1000)
  if (text.length < 3) return { ok: false, error: 'Cevap çok kısa' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { data: existing } = await supabase
    .from('clinic_reviews')
    .select('id, private_clinic_response, iyilestirme_metni')
    .eq('id', reviewId)
    .eq('clinic_id', clinic.id)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'Mesaj bulunamadı' }
  if (!existing.iyilestirme_metni) return { ok: false, error: 'Bu yorumda özel mesaj yok' }
  if (existing.private_clinic_response) return { ok: false, error: 'Bu mesaja zaten yanıt verdin' }

  const now = new Date().toISOString()
  const { error: updErr, data: updRows } = await supabase
    .from('clinic_reviews')
    .update({
      private_clinic_response: text,
      private_responded_at: now,
      // Yanıt yazınca otomatik okundu say
      private_read_at: existing.id ? now : null,
    })
    .eq('id', reviewId)
    .eq('clinic_id', clinic.id)
    .select('id')

  if (updErr) return { ok: false, error: updErr.message }
  if (!updRows || updRows.length === 0) return { ok: false, error: 'Yanıt kaydedilemedi' }

  revalidatePath('/klinik/panel/mesajlar')
  return { ok: true }
}
