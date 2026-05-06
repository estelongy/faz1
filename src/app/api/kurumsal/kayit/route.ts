import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateEmail, validatePassword, checkSignupRateLimit } from '@/lib/signup-policy'

/**
 * Kurumsal kayıt — Klinik & Satıcı için ortak endpoint.
 *
 * Akış: Form → SMS OTP → bu endpoint → user (role=user) → /klinik/basvur veya /satici/basvur
 * Rol asıl olarak başvuru onayında set edilir (admin tarafından).
 *
 * Güvenlik:
 *   - IP rate-limit (saatte 3)
 *   - Disposable email blok
 *   - SMS OTP zorunlu (`phone_verified: true`)
 *   - Şifre min 6 (kolay kuralı)
 */
export async function POST(req: NextRequest) {
  try {
    const rl = await checkSignupRateLimit(req.headers)
    if (!rl.ok) {
      return NextResponse.json({ error: rl.reason }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
    }

    const body = await req.json()
    const {
      email,
      password,
      phone,
      full_name,
      account_type,
      phone_verified,
    } = body

    if (!email || !password || !phone || !full_name) {
      return NextResponse.json({ error: 'Ad soyad, e-posta, telefon ve şifre zorunludur.' }, { status: 400 })
    }
    if (account_type !== 'klinik' && account_type !== 'satici') {
      return NextResponse.json({ error: 'Geçersiz hesap tipi.' }, { status: 400 })
    }
    const emailCheck = validateEmail(email)
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.reason }, { status: 400 })
    const passCheck = validatePassword(password)
    if (!passCheck.ok) return NextResponse.json({ error: passCheck.reason }, { status: 400 })
    if (phone_verified !== true) {
      return NextResponse.json({ error: 'Telefon doğrulaması yapılmamış.' }, { status: 400 })
    }

    const admin = createServiceClient()

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: String(full_name).trim(),
        phone,
        account_type, // başvuru sayfasının yönlendirme için referansı
      },
    })

    if (error || !data.user) {
      const msg = error?.message?.includes('registered')
        ? 'Bu e-posta zaten kayıtlı.'
        : (error?.message || 'Hesap oluşturulamadı.')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    await admin
      .from('profiles')
      .update({
        full_name: String(full_name).trim(),
        phone,
        phone_verified: true,
      })
      .eq('id', data.user.id)

    // Welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/welcome-email')
      const firstName = String(full_name).trim().split(' ')[0] || String(full_name).trim()
      await sendWelcomeEmail({ to: email, firstName, role: 'user' })
    } catch (mailErr) {
      console.error('[Kurumsal Kayıt] Welcome email hatası:', mailErr)
    }

    return NextResponse.json({ success: true, user_id: data.user.id, account_type })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 }
    )
  }
}
