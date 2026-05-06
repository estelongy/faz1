/**
 * Estelongy kayıt güvenlik politikası — merkezi.
 *
 * Tüm kayıt endpoint'leri (api/kayit, api/kurumsal/kayit, api/saglik-profesyoneli/kayit)
 * buradaki helper'ları KULLANMALIDIR.
 * Tek noktadan değiştirilebilir; kural eklenince tüm rollere yayılır.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

/* ─── Disposable / burner e-posta domain blok listesi ─────────────────────
 * Yaygın temp-mail servisleri. Türk ve global liste karışık.
 * Genişletmek için sadece bu listeye ekle. Endpoint'te kontrol otomatiktir.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  '10minutemail.com', '10minutemail.net', '20minutemail.com',
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'sharklasers.com', 'guerrillamailblock.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'getnada.com', 'nada.email',
  'throwawaymail.com', 'maildrop.cc', 'mailnesia.com',
  'trashmail.com', 'trashmail.net', 'trash-mail.com',
  'fakeinbox.com', 'spambog.com', 'spambox.us',
  'dispostable.com', 'mintemail.com', 'jetable.org',
  'mytrashmail.com', 'tempinbox.com', 'mytemp.email',
  'emailondeck.com', 'mail-temp.com', 'tempemail.co',
  'discard.email', 'inboxbear.com', 'wegwerfemail.de',
  'einrot.com', 'binkmail.com', 'gettempmail.com',
  'sogetthis.com', 'spamgourmet.com', 'objectmail.com',
  'mohmal.com', 'getairmail.com', 'mail.tm',
  'minutemail.net', 'tempr.email', 'crazymailing.com',
  'fakemail.fr', 'tmail.io', 'tmail.ws', 'maildim.com',
])

export interface EmailValidation {
  ok: boolean
  reason?: string
}

/**
 * E-posta sözdizimi + disposable kontrolü.
 * MX record kontrolü Cloudflare Turnstile aşamasında eklenecek (Faz C).
 */
export function validateEmail(input: unknown): EmailValidation {
  if (typeof input !== 'string') return { ok: false, reason: 'E-posta geçersiz.' }
  const email = input.trim().toLowerCase()
  if (email.length < 5 || email.length > 254) {
    return { ok: false, reason: 'E-posta geçersiz uzunlukta.' }
  }
  // RFC-light regex — kabul edilebilir genellik
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  if (!re.test(email)) return { ok: false, reason: 'E-posta formatı geçersiz.' }

  const domain = email.split('@')[1]
  if (!domain) return { ok: false, reason: 'E-posta formatı geçersiz.' }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: 'Geçici / atılabilir e-posta servisleri kabul edilmiyor. Lütfen kalıcı bir adres kullanın.',
    }
  }
  return { ok: true }
}

/**
 * Şifre asgari kuralı — kasıtlı olarak gevşek (min 6).
 * UX > güvenlik trade-off'u; bot koruması Turnstile + rate-limit'te.
 */
export function validatePassword(input: unknown): { ok: boolean; reason?: string } {
  if (typeof input !== 'string') return { ok: false, reason: 'Şifre geçersiz.' }
  if (input.length < 6) return { ok: false, reason: 'Şifre en az 6 karakter olmalıdır.' }
  if (input.length > 128) return { ok: false, reason: 'Şifre çok uzun.' }
  return { ok: true }
}

/* ─── IP-based kayıt rate-limit ───────────────────────────────────────────
 * Aynı IP'den saatte 3 kayıt denemesi. Aşılırsa 429.
 * OTP rate-limit'inden ayrı; OTP önce, kayıt sonra zincirde tetiklenir.
 */
export const signupPerHour = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'rl:signup:ip',
})

/**
 * Request'ten istemci IP'sini çıkar (Vercel + Cloudflare uyumlu).
 * Header sırası önemli: gerçek IP'yi proxy'den önce yakalamaya çalışır.
 */
export function getClientIp(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const xf = headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}

/**
 * Kayıt akışında IP rate-limit kontrolü.
 * Endpoint en başında çağrılır; aşıldıysa Response döner, aksi halde null.
 */
export async function checkSignupRateLimit(headers: Headers): Promise<{ ok: true } | { ok: false; reason: string; retryAfter: number }> {
  const ip = getClientIp(headers)
  if (ip === 'unknown') return { ok: true } // proxy dışı edge case — geç
  const res = await signupPerHour.limit(ip)
  if (!res.success) {
    return {
      ok: false,
      reason: 'Çok fazla kayıt denemesi. Lütfen bir saat sonra tekrar deneyin.',
      retryAfter: 3600,
    }
  }
  return { ok: true }
}
