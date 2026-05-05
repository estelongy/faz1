'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestVitrineShare(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Yetkisiz' }

  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { error: 'Klinik bulunamadı' }

  const analysisId = formData.get('analysisId') as string
  const userId = formData.get('userId') as string

  if (!analysisId || !userId) return { error: 'Eksik veri' }

  // Analizi çek (final_overall, web_overall snapshot için)
  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, user_id, web_overall, temp_overall, final_overall')
    .eq('id', analysisId)
    .single()

  if (!analysis || !analysis.final_overall) {
    return { error: 'Bu analizin klinik onayı yok' }
  }

  if (analysis.user_id !== userId) return { error: 'Hasta uyuşmazlığı' }

  // Hasta yaşı için profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('birth_year, gender')
    .eq('id', userId)
    .maybeSingle()

  const patientAge = profile?.birth_year
    ? new Date().getFullYear() - profile.birth_year
    : null

  const initialScore = analysis.web_overall ?? analysis.temp_overall ?? null

  const { error } = await supabase.from('shared_cases').insert({
    clinic_id: clinic.id,
    user_id: userId,
    analysis_id: analysisId,
    initial_score: initialScore,
    final_score: analysis.final_overall,
    patient_age: patientAge,
    patient_gender: profile?.gender ?? null,
    treatment_type: null,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Bu analiz için zaten talep var' }
    return { error: 'Talep oluşturulamadı' }
  }

  revalidatePath(`/klinik/panel/hasta/${userId}`)
  return { success: true }
}

export async function revokeVitrineShare(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Yetkisiz' }

  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { error: 'Klinik bulunamadı' }

  const sharedCaseId = formData.get('sharedCaseId') as string
  const userId = formData.get('userId') as string

  await supabase
    .from('shared_cases')
    .update({ status: 'revoked', responded_at: new Date().toISOString() })
    .eq('id', sharedCaseId)
    .eq('clinic_id', clinic.id)

  revalidatePath(`/klinik/panel/hasta/${userId}`)
  return { success: true }
}

// Hasta tarafı — kabul / red
export async function respondToShareRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Yetkisiz' }

  const sharedCaseId = formData.get('sharedCaseId') as string
  const decision = formData.get('decision') as 'approve' | 'reject'
  const anonymity = formData.get('anonymity') as 'initials' | 'firstname' | 'full_anon' | null

  if (!sharedCaseId || !decision) return { error: 'Eksik veri' }

  const status = decision === 'approve' ? 'approved' : 'rejected'

  await supabase
    .from('shared_cases')
    .update({
      status,
      responded_at: new Date().toISOString(),
      ...(anonymity ? { anonymity_level: anonymity } : {}),
    })
    .eq('id', sharedCaseId)
    .eq('user_id', user.id)

  revalidatePath('/panel')
  return { success: true }
}
