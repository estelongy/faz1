'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Referansör adayı başvurusu — şifresiz, tek adım.
 *
 * Mevcut bir referansör linki paylaşır, aday bilgilerini bırakır.
 * Referansör ONAYSIZ oluşmaz: klinik başvuruyu görüp onaylar.
 * Aynı telefondan bekleyen başvuru varsa tekrar yazılmaz (DB'de).
 */
type Sonuc = { ok: true } | { ok: false; error: string }

export async function basvuruGonder(
  onek: string, ad: string, tel: string, not?: string,
): Promise<Sonuc> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('referral_basvuru_birak', {
    p_onek: onek, p_ad: ad, p_tel: tel, p_not: not ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
