/**
 * Misafir sipariş takip token'ı.
 *
 * Token = HMAC-SHA256(secret, `${orderNumber}:${normalize(email)}`) → base64url
 *
 * Sunulan amaç: misafir bir kullanıcı sipariş no'sunu bilse bile
 * email'siz takip sayfasına giremesin. URL: /siparis/<no>?e=<email>&t=<token>
 *
 * DB'de saklanmaz; tamamen deterministik. Secret değişirse tüm eski linkler
 * geçersiz olur (kasıtlı). Production'da env var ile besle.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const s = process.env.GUEST_ORDER_TOKEN_SECRET
  if (!s || s.length < 16) {
    // Fail-fast: secret yoksa misafir checkout güvenliği yok demektir.
    throw new Error('GUEST_ORDER_TOKEN_SECRET env değişkeni eksik veya çok kısa (min 16 karakter).')
  }
  return s
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function signGuestOrderToken(orderNumber: string, email: string): string {
  const payload = `${orderNumber}:${normalizeEmail(email)}`
  const mac = createHmac('sha256', getSecret()).update(payload).digest()
  return mac.toString('base64url')
}

export function verifyGuestOrderToken(orderNumber: string, email: string, token: string): boolean {
  if (!orderNumber || !email || !token) return false
  let expected: Buffer
  let provided: Buffer
  try {
    expected = createHmac('sha256', getSecret())
      .update(`${orderNumber}:${normalizeEmail(email)}`)
      .digest()
    provided = Buffer.from(token, 'base64url')
  } catch {
    return false
  }
  if (expected.length !== provided.length) return false
  // timing-safe compare — token brute-force engeli
  return timingSafeEqual(expected, provided)
}
