'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { BadgeKey } from '@/lib/badges'

/**
 * Panel açıldığında kullanıcının mevcut durumuna göre
 * eksik rozetleri otomatik olarak verir.
 */
export async function checkAndAwardBadges(): Promise<BadgeKey[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createServiceClient()

  // Mevcut rozetleri al
  const { data: existing } = await admin
    .from('user_badges')
    .select('badge_key')
    .eq('user_id', user.id)
  const owned = new Set((existing ?? []).map(b => b.badge_key as BadgeKey))

  const toAward: BadgeKey[] = []

  // ── Analiz rozeti ──────────────────────────────────────────
  if (!owned.has('ilk_analiz')) {
    const { count } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) > 0) toAward.push('ilk_analiz')
  }

  // ── 3 analiz rozeti ─────────────────────────────────────────
  if (!owned.has('uc_analiz')) {
    const { count } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= 3) toAward.push('uc_analiz')
  }

  // ── Anket rozeti ────────────────────────────────────────────
  if (!owned.has('ilk_anket')) {
    const { count } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('temp_overall', 'is', null)
    if ((count ?? 0) > 0) toAward.push('ilk_anket')
  }

  // ── Randevu rozeti ──────────────────────────────────────────
  if (!owned.has('ilk_randevu')) {
    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) > 0) toAward.push('ilk_randevu')
  }

  // ── Klinik onaylı + skor rozetleri ──────────────────────────
  if (!owned.has('klinik_onayli') || !owned.has('premium_skor') || !owned.has('genc_skor')) {
    const { data: finalAnalyses } = await supabase
      .from('analyses')
      .select('final_overall')
      .eq('user_id', user.id)
      .not('final_overall', 'is', null)
    if (finalAnalyses && finalAnalyses.length > 0) {
      if (!owned.has('klinik_onayli')) toAward.push('klinik_onayli')
      const maxScore = Math.max(...finalAnalyses.map(a => Number(a.final_overall ?? 0)))
      if (!owned.has('premium_skor') && maxScore >= 90) toAward.push('premium_skor')
      if (!owned.has('genc_skor')    && maxScore >= 75) toAward.push('genc_skor')
    }
  }

  // Yeni rozetleri ekle
  if (toAward.length > 0) {
    await admin.from('user_badges').upsert(
      toAward.map(badge_key => ({ user_id: user.id, badge_key })),
      { onConflict: 'user_id,badge_key', ignoreDuplicates: true }
    )
  }

  // Tüm sahip olunan rozetler (eski + yeni)
  return [...Array.from(owned), ...toAward] as BadgeKey[]
}

/**
 * Paylaşım rozetini el ile ver (PaylasModal'dan çağrılır)
 */
export async function awardShareBadge(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const admin = createServiceClient()
  await admin.from('user_badges').upsert(
    [{ user_id: user.id, badge_key: 'ilk_paylasim' }],
    { onConflict: 'user_id,badge_key', ignoreDuplicates: true }
  )
}

/**
 * Streak güncelle (panel her açıldığında çağrılır)
 */
export async function updateStreak(): Promise<{ current: number; longest: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { current: 0, longest: 0 }

  const admin = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: streak } = await admin
    .from('user_activity_streaks')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!streak) {
    await admin.from('user_activity_streaks').insert({
      user_id: user.id,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    return { current: 1, longest: 1 }
  }

  const last = streak.last_activity_date
  if (last === today) {
    return { current: streak.current_streak, longest: streak.longest_streak }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const newCurrent = last === yesterdayStr ? (streak.current_streak ?? 0) + 1 : 1
  const newLongest = Math.max(newCurrent, streak.longest_streak ?? 0)

  await admin.from('user_activity_streaks').update({
    current_streak: newCurrent,
    longest_streak: newLongest,
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return { current: newCurrent, longest: newLongest }
}
