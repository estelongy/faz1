/**
 * Estelongy Klinik Onboarding — 4 Adımlı Hoşgeldin Yolculuğu
 *
 * Her klinik ilk kayıt sonrası 4 adımı tamamlamak için yönlendirilir.
 * Adımlar tamamlandıkça somut ödüller açılır.
 * 4 adım bittiğinde banner kaybolur, klinik Faz 1'e (Doğrulanmış Hekim) geçer.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface OnboardingStep {
  id: 'profile' | 'availability' | 'first_appt' | 'first_approval'
  number: 1 | 2 | 3 | 4
  title: string
  description: string
  reward: string
  rewardEmoji: string
  ctaLabel: string
  ctaHref: string
  completed: boolean
}

export interface OnboardingStatus {
  steps: OnboardingStep[]
  completedCount: number
  totalCount: number
  isComplete: boolean
  /** Sıradaki tamamlanmamış adım (yoksa null) */
  nextStep: OnboardingStep | null
}

export async function computeOnboarding(
  clinicId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<OnboardingStatus> {

  const [
    clinicResult,
    availabilityCountResult,
    apptCountResult,
    onayCountResult,
  ] = await Promise.all([
    supabase.from('clinics').select('name, location, bio, specialties').eq('id', clinicId).maybeSingle(),
    supabase.from('clinic_availability').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).in('status', ['confirmed', 'completed', 'in_progress']),
    supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).not('final_overall', 'is', null),
  ])

  const clinic = clinicResult.data
  const profileComplete = !!(
    clinic?.name && clinic?.location && clinic?.bio &&
    clinic?.specialties && clinic.specialties.length > 0
  )
  const hasAvailability = (availabilityCountResult.count ?? 0) > 0
  const hasFirstAppt = (apptCountResult.count ?? 0) > 0
  const hasFirstApproval = (onayCountResult.count ?? 0) > 0

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      number: 1,
      title: 'Profilini tamamla',
      description: 'Klinik adı, konum, kısa bio ve uzmanlık alanları',
      reward: '"Doğrulanmış Hekim" rozeti açılır',
      rewardEmoji: '✓',
      ctaLabel: 'Profile git',
      ctaHref: '/klinik/panel/profil',
      completed: profileComplete,
    },
    {
      id: 'availability',
      number: 2,
      title: 'Müsaitlik takvimini oluştur',
      description: 'Çalışma saatlerini gir, hasta randevu alabilsin',
      reward: '20 hediye kredi açılır (ücretsiz randevu kabulü)',
      rewardEmoji: '🎁',
      ctaLabel: 'Müsaitlik tanımla',
      ctaHref: '/klinik/panel/musaitlik',
      completed: hasAvailability,
    },
    {
      id: 'first_appt',
      number: 3,
      title: 'İlk randevunu kabul et',
      description: 'Müsaitlik açılınca hastalar randevu talebi gönderir',
      reward: 'Akademi içeriği unlocked',
      rewardEmoji: '📰',
      ctaLabel: 'Takvime git',
      ctaHref: '/klinik/panel/takvim',
      completed: hasFirstAppt,
    },
    {
      id: 'first_approval',
      number: 4,
      title: 'İlk klinik onayını ver',
      description: 'Hastanı muayene et, "Klinik Onaylı Skor" doğrulamasını yap',
      reward: '"Estelongy Hekimi" rozeti + Faz 1 akreditasyon',
      rewardEmoji: '⭐',
      ctaLabel: 'Hastalarıma git',
      ctaHref: '/klinik/panel/hastalarim',
      completed: hasFirstApproval,
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const totalCount = steps.length
  const isComplete = completedCount === totalCount
  const nextStep = steps.find(s => !s.completed) ?? null

  return {
    steps,
    completedCount,
    totalCount,
    isComplete,
    nextStep,
  }
}
