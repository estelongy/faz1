/**
 * Estelongy Klinik Akreditasyon Sistemi
 *
 * Faz 0: Henüz kriterleri karşılamayan yeni klinik
 * Faz 1: Doğrulanmış Hekim — temel kalite eşiği
 * Faz 2: Estelongy Hekimi — orta seviye, partner avantajları açılır
 * Faz 3: Estelongy Uzmanı — üst seviye, kongre daveti, akademik üretim
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type AccreditationPhase = 0 | 1 | 2 | 3

export interface Criterion {
  id: string
  label: string
  current: number | string
  target: number | string
  completed: boolean
  hint?: string
}

export interface Accreditation {
  phase: AccreditationPhase
  phaseLabel: string
  phaseColor: string  // tailwind text class
  nextPhaseLabel: string | null
  progressPct: number  // 0-100, sonraki faza ilerleme
  criteria: Criterion[]  // sonraki faz için
  rewards: string[]     // mevcut faz ödülleri
  nextRewards: string[] // sonraki faz ödülleri (motivasyon)
}

const PHASE_META: Record<AccreditationPhase, { label: string; color: string; rewards: string[] }> = {
  0: {
    label: 'Yeni Klinik',
    color: 'text-slate-400',
    rewards: ['Estelongy panel erişimi', 'Hediye kredi (ilk randevu)'],
  },
  1: {
    label: 'Doğrulanmış Hekim',
    color: 'text-violet-300',
    rewards: ['"Doğrulanmış Hekim" rozeti', 'Profil paylaşım kartı', 'Klinik onaylı skor verme yetkisi'],
  },
  2: {
    label: 'Estelongy Hekimi',
    color: 'text-emerald-300',
    rewards: ['"Estelongy Hekimi" rozeti', 'Mağaza komisyon indirimi', 'Partner avantajları (Shell, Rixos)', 'Akademi içerik erişimi'],
  },
  3: {
    label: 'Estelongy Uzmanı',
    color: 'text-amber-300',
    rewards: ['"Estelongy Uzmanı" rozeti (üst kademe)', 'Estelongy Kongresi konuşma daveti', 'Akademik içerik üretim sözleşmesi', 'Partner avantajları üst kademe'],
  },
}

/**
 * Bir klinik için akreditasyon durumunu hesapla.
 * On-the-fly hesaplama — şimdilik cache yok.
 */
export async function computeAccreditation(
  clinicId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<Accreditation> {

  // ── Veri toplama paralel
  const [
    clinicResult,
    apptCountResult,
    onayCountResult,
    availabilityCountResult,
  ] = await Promise.all([
    supabase.from('clinics').select('name, location, bio, specialties, certificate_url').eq('id', clinicId).maybeSingle(),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).in('status', ['confirmed', 'completed', 'in_progress']),
    supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).not('final_overall', 'is', null),
    supabase.from('clinic_availability').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
  ])

  const clinic = clinicResult.data
  const apptCount = apptCountResult.count ?? 0
  const onayCount = onayCountResult.count ?? 0
  const availabilityCount = availabilityCountResult.count ?? 0

  // ── Kriter tanımları (her faz için)
  const profileComplete = !!(
    clinic?.name &&
    clinic?.location &&
    clinic?.bio &&
    clinic?.specialties && clinic.specialties.length > 0
  )

  // Faz 1 kriterleri (Doğrulanmış Hekim'e yükselmek için)
  const faz1Criteria: Criterion[] = [
    {
      id: 'profile',
      label: 'Profil tamam',
      current: profileComplete ? 'Tamam' : 'Eksik',
      target: 'Tamam',
      completed: profileComplete,
      hint: profileComplete ? undefined : 'Klinik adı, konum, kısa bio ve uzmanlık alanları girilmeli',
    },
    {
      id: 'availability',
      label: 'Müsaitlik takvimi',
      current: availabilityCount > 0 ? 'Tanımlı' : 'Eksik',
      target: 'Tanımlı',
      completed: availabilityCount > 0,
      hint: availabilityCount === 0 ? 'Müsaitlik sayfasından çalışma saatlerini gir' : undefined,
    },
    {
      id: 'appts',
      label: 'Onaylı randevu',
      current: apptCount,
      target: 5,
      completed: apptCount >= 5,
    },
  ]

  // Faz 2 kriterleri (Estelongy Hekimi)
  const faz2Criteria: Criterion[] = [
    {
      id: 'appts_20',
      label: 'Onaylı randevu',
      current: apptCount,
      target: 20,
      completed: apptCount >= 20,
    },
    {
      id: 'onay_5',
      label: 'Klinik onayı (skor doğrulama)',
      current: onayCount,
      target: 5,
      completed: onayCount >= 5,
    },
  ]

  // Faz 3 kriterleri (Estelongy Uzmanı)
  const faz3Criteria: Criterion[] = [
    {
      id: 'appts_100',
      label: 'Onaylı randevu',
      current: apptCount,
      target: 100,
      completed: apptCount >= 100,
    },
    {
      id: 'onay_30',
      label: 'Klinik onayı',
      current: onayCount,
      target: 30,
      completed: onayCount >= 30,
    },
  ]

  // ── Mevcut faz hesabı
  const faz1Met = faz1Criteria.every(c => c.completed)
  const faz2Met = faz1Met && faz2Criteria.every(c => c.completed)
  const faz3Met = faz2Met && faz3Criteria.every(c => c.completed)

  let phase: AccreditationPhase = 0
  if (faz3Met) phase = 3
  else if (faz2Met) phase = 2
  else if (faz1Met) phase = 1

  // ── Sonraki faza ilerleme
  let nextCriteria: Criterion[] = []
  let nextPhase: AccreditationPhase | null = null
  if (phase === 0) { nextCriteria = faz1Criteria; nextPhase = 1 }
  else if (phase === 1) { nextCriteria = faz2Criteria; nextPhase = 2 }
  else if (phase === 2) { nextCriteria = faz3Criteria; nextPhase = 3 }

  let progressPct = 100
  if (nextCriteria.length > 0) {
    const completedRatio = nextCriteria.filter(c => c.completed).length / nextCriteria.length
    // Sayısal kriterler için kısmi ilerleme — son kriterin progress'ı da sayılır
    let partialBoost = 0
    for (const c of nextCriteria) {
      if (!c.completed && typeof c.current === 'number' && typeof c.target === 'number' && c.target > 0) {
        partialBoost += Math.min(c.current / c.target, 1) / nextCriteria.length
      }
    }
    progressPct = Math.round((completedRatio + partialBoost) * 100)
    progressPct = Math.min(99, progressPct)  // 100 sadece geçince
  }

  return {
    phase,
    phaseLabel: PHASE_META[phase].label,
    phaseColor: PHASE_META[phase].color,
    nextPhaseLabel: nextPhase !== null ? PHASE_META[nextPhase].label : null,
    progressPct,
    criteria: nextCriteria,
    rewards: PHASE_META[phase].rewards,
    nextRewards: nextPhase !== null ? PHASE_META[nextPhase].rewards : [],
  }
}
