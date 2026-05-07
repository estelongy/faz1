import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkLoginLock,
  recordLoginFail,
  clearLoginFails,
  getClientIp,
} from '@/lib/login-ratelimit'

const LOCKOUT_FALLBACK = 900

/**
 * Server-side login + IP brute-force koruması.
 *
 *  - 10 yanlış deneme/dk → 15 dk kilit (IP başına)
 *  - Başarılı login fail sayacını sıfırlar
 *  - Cookie'ler @supabase/ssr server client üzerinden set edilir
 */
export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req)

  // 1. Kilit kontrolü
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

  // 2. Body parse
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

  // 3. Supabase login (cookie'leri SSR client set eder)
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // 4a. Başarısız → sayacı arttır
    const result = await recordLoginFail(ip)
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

  // 4b. Başarılı → fail sayacını sıfırla
  await clearLoginFails(ip)

  const role = (data.user?.app_metadata as Record<string, string> | undefined)?.role ?? null
  return NextResponse.json({ ok: true, role })
}
