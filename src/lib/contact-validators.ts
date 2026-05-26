/**
 * Basit email & TR telefon validatorleri. Misafir checkout için.
 *
 * Karmaşık RFC 5322 yerine pratik bir regex — gerçek doğrulama email gönderilirken
 * Resend'in bounce handling'ine bırakılır.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const TR_PHONE_RE = /^(?:\+90|0)?5\d{9}$/

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

export function normalizeTrPhone(value: string): string {
  // Boşluk, tire, parantez sil. Sonra +90 / 0 prefix'ini at ki kanonik 10 hane kalsın.
  let v = value.replace(/[\s\-()]/g, '')
  if (v.startsWith('+90')) v = v.slice(3)
  else if (v.startsWith('0')) v = v.slice(1)
  return v
}

export function isValidTrMobile(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const raw = value.trim()
  if (!TR_PHONE_RE.test(raw.replace(/[\s\-()]/g, ''))) return false
  const normalized = normalizeTrPhone(raw)
  return normalized.length === 10 && normalized.startsWith('5')
}
