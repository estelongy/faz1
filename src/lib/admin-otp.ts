import { redis } from '@/lib/redis'
import { redirect } from 'next/navigation'

/**
 * Admin login → SMS OTP zorunlu akışı + step-up auth.
 *
 * Akış:
 *  1. Kullanıcı /giris'te email + şifre ile giriş yapar (Supabase Auth session açılır)
 *  2. Admin ise middleware /admin/*'a girişten önce isVerified() kontrolü yapar
 *  3. Yoksa /giris/admin-otp'ye yönlendirilir
 *  4. Telefonuna SMS kodu gider, doğru kod → markVerified
 *  5. Cookie değil — Upstash'te user-id bazlı 30 dk'lık session
 *
 * Step-up:
 *  - Kritik aksiyonlar (rol değiştirme, vendor/klinik onayı, app_settings) öncesi
 *    son 5 dk içinde SMS doğrulanmış mı kontrol edilir.
 *  - Değilse aksiyon iptal, /giris/admin-otp?reason=step-up'a redirect.
 *  - Yeniden doğrulanınca timestamp güncellenir, kullanıcı geri dönüp aksiyonu tekrarlar.
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

/**
 * Server action içinde çağrılır. Eğer son 5 dk içinde SMS doğrulanmamışsa,
 * adminin step-up sayfasına redirect eder ve aksiyon iptal olur.
 *
 * @param userId Mevcut admin user.id
 * @param returnTo Adminin geri döneceği path (örn '/admin/saticilar')
 */
export async function ensureAdminOtpFresh(
  userId: string,
  returnTo: string,
  maxAgeSec = 5 * 60
): Promise<void> {
  const fresh = await isAdminOtpFresh(userId, maxAgeSec)
  if (!fresh) {
    const safeReturn = returnTo.startsWith('/') ? returnTo : '/admin'
    redirect(`/giris/admin-otp?reason=step-up&next=${encodeURIComponent(safeReturn)}`)
  }
}
