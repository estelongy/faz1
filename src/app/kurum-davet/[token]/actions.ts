'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Kurumsal referansör daveti — kurum kendi kabul eder.
 *
 * Klinik daveti oluşturur, kurum linki açar ve oranı görüp onaylar.
 * Kabul edene kadar referansör pasiftir, kod üretemez: anlaşma karşı
 * tarafın onayıyla kurulur, klinik tek taraflı aktifleştiremez.
 */

type Sonuc = { ok: true } | { ok: false; error: string }

export async function kurumKabulEt(token: string): Promise<Sonuc> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('referral_kurum_kabul', { p_token: token })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function kurumReddet(token: string): Promise<Sonuc> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('referral_kurum_red', { p_token: token })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
