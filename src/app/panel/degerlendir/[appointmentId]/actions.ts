'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateReviewInput, type ClinicReviewInput } from '@/lib/clinic-review'

export interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * Yorum gönder (insert ya da update — appointment_id UNIQUE).
 * - Hasta sahipliği
 * - Randevu completed
 * - Mevcut yorum varsa edit_window_until içinde olmalı
 */
export async function submitReviewAction(input: ClinicReviewInput): Promise<ActionResult> {
  const validated = validateReviewInput(input)
  if (!validated.ok) return { ok: false, error: validated.error }
  const v = validated.value

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  // Randevuyu doğrula
  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .select('id, user_id, clinic_id, status')
    .eq('id', v.appointmentId)
    .maybeSingle()

  if (apptErr || !appt) return { ok: false, error: 'Randevu bulunamadı' }
  if (appt.user_id !== user.id) return { ok: false, error: 'Bu randevu sana ait değil' }
  if (appt.status !== 'completed') return { ok: false, error: 'Yalnızca tamamlanmış randevular değerlendirilebilir' }

  // Mevcut yorum?
  const { data: existing } = await supabase
    .from('clinic_reviews')
    .select('id, edit_window_until')
    .eq('appointment_id', v.appointmentId)
    .maybeSingle()

  if (existing) {
    // Düzenleme penceresi kontrolü
    if (new Date(existing.edit_window_until) < new Date()) {
      return { ok: false, error: 'Düzenleme süresi (7 gün) doldu' }
    }
    const { error: updErr, data: updRows } = await supabase
      .from('clinic_reviews')
      .update({
        hijyen: v.hijyen,
        personel: v.personel,
        randevu_uyumu: v.randevuUyumu,
        iletisim: v.iletisim,
        nps: v.nps,
        gereksiz_islem: v.gereksizIslem,
        tekrar_gelir: v.tekrarGelir,
        pozitif_metin: v.pozitifMetin,
        iyilestirme_metni: v.iyilestirmeMetni,
        is_anonymous: v.isAnonymous,
        private_wants_reply: v.privateWantsReply,
      })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('id')

    if (updErr) return { ok: false, error: updErr.message }
    if (!updRows || updRows.length === 0) return { ok: false, error: 'Güncelleme yapılamadı' }
  } else {
    const { error: insErr, data: insRows } = await supabase
      .from('clinic_reviews')
      .insert({
        appointment_id: v.appointmentId,
        clinic_id: appt.clinic_id,
        user_id: user.id,
        hijyen: v.hijyen,
        personel: v.personel,
        randevu_uyumu: v.randevuUyumu,
        iletisim: v.iletisim,
        nps: v.nps,
        gereksiz_islem: v.gereksizIslem,
        tekrar_gelir: v.tekrarGelir,
        pozitif_metin: v.pozitifMetin,
        iyilestirme_metni: v.iyilestirmeMetni,
        is_anonymous: v.isAnonymous,
        private_wants_reply: v.privateWantsReply,
      })
      .select('id')

    if (insErr) return { ok: false, error: insErr.message }
    if (!insRows || insRows.length === 0) return { ok: false, error: 'Yorum kaydedilemedi' }
  }

  revalidatePath(`/panel/degerlendir/${v.appointmentId}`)
  revalidatePath('/panel/analizlerim')
  revalidatePath('/panel')
  return { ok: true }
}

/**
 * Klinik tek-seferlik cevap.
 */
export async function clinicRespondAction(
  reviewId: string,
  response: string,
): Promise<ActionResult> {
  const text = (response ?? '').trim().slice(0, 1000)
  if (text.length < 3) return { ok: false, error: 'Cevap çok kısa' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  // Klinik sahipliği kontrolü — RLS de kontrol ediyor ama erken çıkış için
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  // Daha önce cevap yazılmış mı?
  const { data: existing } = await supabase
    .from('clinic_reviews')
    .select('id, clinic_response')
    .eq('id', reviewId)
    .eq('clinic_id', clinic.id)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'Yorum bulunamadı' }
  if (existing.clinic_response) return { ok: false, error: 'Bu yoruma zaten cevap verdin' }

  const { error: updErr, data: updRows } = await supabase
    .from('clinic_reviews')
    .update({
      clinic_response: text,
      clinic_responded_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('clinic_id', clinic.id)
    .select('id')

  if (updErr) return { ok: false, error: updErr.message }
  if (!updRows || updRows.length === 0) return { ok: false, error: 'Cevap kaydedilemedi' }

  revalidatePath('/klinik/panel/yorumlar')
  return { ok: true }
}
