/**
 * Sunucu tarafı versiyonlu açık rıza (KVKK m.6/2 — açık rıza) yöneticisi.
 *
 * Scope'lar:
 *  - 'selfie_ai_analiz' v1: selfie + AI yüz analizi (OpenAI'a görsel gönderimi dahil)
 *  - 'longevity_survey' v1: longevity anketi yanıtları
 *  - 'klinik_paylasim'  v1: vakanın klinik vitrininde anonim paylaşımı
 *
 * Versiyon değişirse onay tekrar istenir.
 */

import { createServiceClient } from '@/lib/supabase/service'

export const CONSENT_SCOPES = {
  selfie_ai_analiz: 'v1',
  longevity_survey: 'v1',
  klinik_paylasim:  'v1',
} as const

export type ConsentScope = keyof typeof CONSENT_SCOPES

export interface ConsentRequestMeta {
  ip?: string | null
  userAgent?: string | null
}

/** Aktif (en son granted=true) consent var mı? */
export async function hasActiveConsent(
  userId: string,
  scope: ConsentScope,
): Promise<boolean> {
  const version = CONSENT_SCOPES[scope]
  const admin = createServiceClient()
  const { data, error } = await admin.rpc('has_active_consent', {
    p_user_id: userId,
    p_scope:   scope,
    p_version: version,
  })
  if (error) {
    console.error('[consent] has_active_consent rpc error:', error)
    return false
  }
  return !!data
}

/** Yeni onay kaydı. Idempotent değil — her tıklama bir satır. */
export async function recordConsent(
  userId: string,
  scope: ConsentScope,
  granted: boolean,
  meta: ConsentRequestMeta = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const version = CONSENT_SCOPES[scope]
  const admin = createServiceClient()
  const { error } = await admin.from('consent_logs').insert({
    user_id:    userId,
    scope,
    version,
    granted,
    ip_address: meta.ip ?? null,
    user_agent: meta.userAgent ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Request header'larından IP'yi türetir. */
export function getClientIpFromHeaders(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const xf = headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}
