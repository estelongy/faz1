import { redis } from '@/lib/redis'

/**
 * Admin login → SMS OTP zorunlu akışı.
 *
 * Akış:
 *  1. Kullanıcı /giris'te email + şifre ile giriş yapar (Supabase Auth session açılır)
 *  2. Admin ise middleware /admin/*'a girişten önce isVerified() kontrolü yapar
 *  3. Yoksa /giris/admin-otp'ye yönlendirilir
 *  4. Telefonuna SMS kodu gider, doğru kod → markVerified
 *  5. Cookie değil — Upstash'te user-id bazlı 30 dk'lık session
 */

const KEY_PREFIX = 'admin_otp:verified:'
const VERIFIED_TTL_SEC = 30 * 60 // 30 dakika

export async function markAdminOtpVerified(userId: string): Promise<void> {
  await redis.set(`${KEY_PREFIX}${userId}`, Date.now(), { ex: VERIFIED_TTL_SEC })
}

export async function isAdminOtpVerified(userId: string): Promise<boolean> {
  const v = await redis.get<number>(`${KEY_PREFIX}${userId}`)
  return v !== null && v !== undefined
}

export async function clearAdminOtpVerification(userId: string): Promise<void> {
  await redis.del(`${KEY_PREFIX}${userId}`)
}

/**
 * Step-up: kritik aksiyon öncesi son N dakikada OTP geçilmiş olmalı.
 * 30 dk session içinde bile, her hassas aksiyon için "fresh" kontrol.
 */
export async function isAdminOtpFresh(userId: string, maxAgeSec = 5 * 60): Promise<boolean> {
  const ts = await redis.get<number>(`${KEY_PREFIX}${userId}`)
  if (!ts) return false
  return Date.now() - Number(ts) < maxAgeSec * 1000
}
