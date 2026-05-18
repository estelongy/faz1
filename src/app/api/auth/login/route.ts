import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  checkLoginLock,
  recordLoginFail,
  clearLoginFails,
  recordUserLoginFailAndShouldEmail,
  clearUserLoginFails,
  getClientIp,
} from '@/lib/login-ratelimit'
import { sendEmail } from '@/lib/notifications'
import { tmplFailedLoginAlert } from '@/lib/email-templates'

const LOCKOUT_FALLBACK = 900

/**
 * Test/seed hesapları — lockout bypass.
 * Bu hesaplara IP rate-limit uygulanmaz; QA + smoke-test akışını bloklamaz.
 */
const LOCKOUT_BYPASS_EMAILS = new Set<string>([
  'test-vendor@estelongy.com',
])

/**
 * Server-side login + IP brute-force koruması.
 *
 *  - 10 yanlış deneme/dk → 15 dk kilit (IP başına)
 *  - Başarılı login fail sayacını sıfırlar
 *  - Cookie'ler @supabase/ssr server client üzerinden set edilir
 */
export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req)

  // 1. Body parse (email bypass kontrolünden önce gerekli)
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password) {
    return NextResponse.json({ error: 'E-posta ve şifre zorunludur' }, { status: 400 })
  }

  const bypass = LOCKOUT_BYPASS_EMAILS.has(email)

  // 2. Kilit kontrolü (bypass hesapları için atlanır)
  if (!bypass) {
    const lock = await checkLoginLock(ip)
    if (lock.locked) {
      return NextResponse.json(
        {
          error: `Çok fazla başarısız deneme. ${Math.ceil((lock.retryAfter ?? 0) / 60)} dakika sonra tekrar deneyin.`,
          locked: true,
          retryAfter: lock.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(lock.retryAfter ?? LOCKOUT_FALLBACK) },
        }
      )
    }
  }

  // 3. Supabase login (cookie'leri SSR client set eder)
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // 4a. Başarısız → IP sayacı + (opsiyonel) hesap sayacı arttır (bypass hariç)
    const result = bypass
      ? { locked: false, remaining: 999 }
      : await recordLoginFail(ip)

    // Hesap-bazlı uyarı: e-posta gerçek bir hesaba aitse mail gönder
    // (Saldırgan kendi mail'ine denemiyor → enumeration sızıntısı yok)
    void notifyAccountIfThreshold(email, ip).catch(() => {})

    if (result.locked) {
      return NextResponse.json(
        {
          error: 'Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.',
          locked: true,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(result.retryAfter ?? LOCKOUT_FALLBACK) },
        }
      )
    }
    const msg = error.message === 'Invalid login credentials'
      ? 'E-posta veya şifre hatalı.'
      : error.message
    return NextResponse.json(
      { error: msg, remaining: result.remaining },
      { status: 401 }
    )
  }

  // 4b. Başarılı → fail sayacını sıfırla (IP + hesap)
  await clearLoginFails(ip)
  if (data.user?.id) await clearUserLoginFails(data.user.id)

  const role = (data.user?.app_metadata as Record<string, string> | undefined)?.role ?? null
  return NextResponse.json({ ok: true, role })
}

/**
 * Verilen e-posta gerçek bir hesaba aitse ve son 24h'te 3+ başarısız deneme
 * varsa hesap sahibine uyarı maili gönder. Cooldown 24h. Hata yutulur — ana
 * akış asla bloklanmaz.
 */
async function notifyAccountIfThreshold(email: string, ip: string): Promise<void> {
  const admin = createServiceClient()
  // Direct auth.users lookup (service role bypasses RLS)
  const { data: rows } = await admin
    .schema('auth' as never)
    .from('users' as never)
    .select('id')
    .eq('email', email)
    .limit(1) as { data: { id: string }[] | null }

  const userId = rows?.[0]?.id
  if (!userId) return

  const shouldEmail = await recordUserLoginFailAndShouldEmail(userId)
  if (!shouldEmail) return

  const tmpl = tmplFailedLoginAlert({
    email,
    ip,
    when: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
  })
  await sendEmail(email, tmpl.subject, tmpl.html)
}
