/**
 * Login brute-force koruması (Upstash Redis)
 *
 * Kurallar:
 *  - IP başına dakikada 10 BAŞARISIZ deneme → 15 dakikalık kilit
 *  - Başarılı login fail sayacını sıfırlar (legit kullanıcı kilitlenmez)
 *  - Lockout süresi içinde tüm istekler 429 ile reddedilir
 *
 * Anahtarlar:
 *  - login_fail:<ip>     → sayaç, TTL 60s
 *  - login_lockout:<ip>  → 1 (varlık kontrolü), TTL 900s
 */

import { redis } from '@/lib/redis'

const FAIL_KEY = (ip: string) => `login_fail:${ip}`
const LOCK_KEY = (ip: string) => `login_lockout:${ip}`

const MAX_FAILS_PER_MINUTE = 10
const LOCKOUT_SECONDS = 15 * 60
const FAIL_WINDOW_SECONDS = 60

export interface LockState {
  locked: boolean
  /** Saniye cinsinden kalan kilit süresi (locked=true ise) */
  retryAfter?: number
}

/** Lockout anahtarı varsa kilitli; yoksa serbest. */
export async function checkLoginLock(ip: string): Promise<LockState> {
  const exists = await redis.get(LOCK_KEY(ip))
  if (!exists) return { locked: false }
  const ttl = await redis.ttl(LOCK_KEY(ip))
  return { locked: true, retryAfter: Math.max(1, ttl) }
}

/**
 * Başarısız denemeyi kaydet.
 * 10. başarısız denemede 15 dk kilit aktif.
 *
 * @returns aktif kilit varsa retryAfter, yoksa kalan deneme sayısı
 */
export async function recordLoginFail(
  ip: string
): Promise<{ locked: boolean; remaining: number; retryAfter?: number }> {
  const fails = await redis.incr(FAIL_KEY(ip))
  if (fails === 1) {
    await redis.expire(FAIL_KEY(ip), FAIL_WINDOW_SECONDS)
  }

  if (fails >= MAX_FAILS_PER_MINUTE) {
    await redis.set(LOCK_KEY(ip), 1, { ex: LOCKOUT_SECONDS })
    await redis.del(FAIL_KEY(ip))
    return { locked: true, remaining: 0, retryAfter: LOCKOUT_SECONDS }
  }

  return { locked: false, remaining: Math.max(0, MAX_FAILS_PER_MINUTE - fails) }
}

/** Başarılı login → fail sayacı sıfırla. Lockout zaten yokken çağrılır. */
export async function clearLoginFails(ip: string): Promise<void> {
  await redis.del(FAIL_KEY(ip))
}

/** Vercel/Next üzerinde IP çıkarımı — proxy zincirinin ilk halkası. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
