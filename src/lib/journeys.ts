/**
 * Estelongy Journey (Yolculuk) Sistemi
 *
 * Her kullanıcının en fazla 1 aktif journey'i olabilir.
 * Yeni bir ön analiz her zaman aktif journey'e bağlanır.
 * Klinik ziyareti tamamlandığında journey otomatik kapanır (DB trigger ile).
 * Yeni analiz = yeni selfie denemesi; aynı journey'e eklenir, önceki gizlenir.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Kullanıcının aktif journey id'sini döner.
 * Yoksa yeni bir journey oluşturur.
 */
export async function getOrCreateActiveJourney(
  userId: string,
  supabase: SupabaseClient,
): Promise<string> {
  // Aktif journey var mı?
  const { data: existing } = await supabase
    .from('journeys')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  // Yeni journey oluştur
  const { data: created, error } = await supabase
    .from('journeys')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single()

  if (error || !created?.id) {
    console.error('[Journey] Oluşturulamadı:', error?.message)
    throw new Error('Journey oluşturulamadı')
  }

  return created.id
}
