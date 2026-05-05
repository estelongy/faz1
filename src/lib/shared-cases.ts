/**
 * Sonuç Vitrini — Hasta Paylaşım İzni Sistemi
 *
 * Hekim bir vakanın sonucunu vitrinde sergilemek için hastadan rıza ister.
 * Hasta kabul ederse vaka anonim biçimde gösterilir.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type SharedCaseStatus = 'pending' | 'approved' | 'rejected' | 'revoked'
export type AnonymityLevel = 'initials' | 'firstname' | 'full_anon'

export interface SharedCase {
  id: string
  clinic_id: string
  user_id: string
  analysis_id: string
  initial_score: number | null
  final_score: number | null
  patient_age: number | null
  patient_gender: string | null
  treatment_type: string | null
  status: SharedCaseStatus
  requested_at: string
  responded_at: string | null
  anonymity_level: AnonymityLevel
}

export interface SharedCaseWithProfile extends SharedCase {
  patient_full_name: string | null
  clinic_name: string | null
}

/**
 * Hekim için: bu kliniğin onaylanmış vitrini vakaları
 * Sonuç Vitrini kartında en yüksek Δ vakası gösterilir
 */
export async function fetchApprovedCases(
  clinicId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5,
): Promise<SharedCaseWithProfile[]> {
  const { data, error } = await supabase
    .from('shared_cases')
    .select('id, clinic_id, user_id, analysis_id, initial_score, final_score, patient_age, patient_gender, treatment_type, status, requested_at, responded_at, anonymity_level, profiles:user_id(full_name)')
    .eq('clinic_id', clinicId)
    .eq('status', 'approved')
    .order('responded_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as unknown as Array<SharedCase & { profiles?: { full_name?: string | null } | null }>).map(row => ({
    ...row,
    patient_full_name: row.profiles?.full_name ?? null,
    clinic_name: null,
  }))
}

/**
 * Bekleyen rıza talepleri sayısı (hasta paneli için)
 */
export async function fetchPendingRequestsForUser(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
): Promise<SharedCaseWithProfile[]> {
  const { data, error } = await supabase
    .from('shared_cases')
    .select('id, clinic_id, user_id, analysis_id, initial_score, final_score, patient_age, patient_gender, treatment_type, status, requested_at, responded_at, anonymity_level, clinics:clinic_id(name)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error || !data) return []

  return (data as unknown as Array<SharedCase & { clinics?: { name?: string | null } | null }>).map(row => ({
    ...row,
    patient_full_name: null,
    clinic_name: row.clinics?.name ?? null,
  }))
}

/**
 * Vitrinde gösterilecek hasta adını anonim seviyeye göre formatla
 */
export function formatAnonymousName(fullName: string | null, level: AnonymityLevel): string {
  if (!fullName || level === 'full_anon') return 'Hasta'
  const parts = fullName.trim().split(/\s+/)
  if (level === 'firstname') return parts[0] ?? 'Hasta'
  // initials: "Aslı Kara" → "A. K."
  return parts.map(p => p[0]?.toUpperCase() + '.').join(' ')
}

/**
 * Score Δ hesabı
 */
export function calculateDelta(initial: number | null, final: number | null): number | null {
  if (initial == null || final == null) return null
  return final - initial
}
