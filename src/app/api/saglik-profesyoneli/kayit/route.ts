import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateEmail, validatePassword, checkSignupRateLimit } from '@/lib/signup-policy'

const VALID_TITLES = [
  'Dr.',
  'Uz. Dr.',
  'Op. Dr.',
  'Prof. Dr.',
  'Doç. Dr.',
  'Diş Hekimi',
  'Hemşire',
  'Eczacı',
  'Tıp Öğrencisi',
  'Diğer',
] as const

/**
 * Sağlık Profesyoneli kayıt akışı (kurumsal giriş üzerinden).
 *
 * Beyan bazlı — diploma/uzmanlık doğrulaması yapılmaz, kullanıcı beyanı esastır.
 * SMS OTP doğrulaması yapılmış telefon zorunlu (`phone_verified: true`).
 *
 * Erişim: /panel (sağlık profesyoneli teması) + Akademi (kurs satın alma & izleme)
 *         + Mağaza. Hasta panel özellikleri (analiz/randevu) açılmaz.
 */
export async function POST(req: NextRequest) {
  try {
    // IP rate-limit (saatte 3 kayıt/IP)
    const rl = await checkSignupRateLimit(req.headers)
    if (!rl.ok) {
      return NextResponse.json({ error: rl.reason }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
    }

    const body = await req.json()
    const {
      email,
      password,
      phone,
      first_name,
      last_name,
      hp_title,
      hp_specialty,
      hp_institution,
      hp_declaration,
      kvkk_accepted,
      phone_verified,
    } = body

    // Zorunlu alanlar
    if (!email || !password || !phone || !first_name || !last_name) {
      return NextResponse.json({ error: 'Ad, soyad, e-posta, telefon ve şifre zorunludur.' }, { status: 400 })
    }
    const emailCheck = validateEmail(email)
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.reason }, { status: 400 })
    const passCheck = validatePassword(password)
    if (!passCheck.ok) return NextResponse.json({ error: passCheck.reason }, { status: 400 })
    if (phone_verified !== true) {
      return NextResponse.json({ error: 'Telefon doğrulaması yapılmamış.' }, { status: 400 })
    }
    if (!hp_title || !VALID_TITLES.includes(hp_title)) {
      return NextResponse.json({ error: 'Geçerli bir ünvan seçin.' }, { status: 400 })
    }
    if (!hp_specialty || typeof hp_specialty !== 'string' || hp_specialty.trim().length < 3) {
      return NextResponse.json({ error: 'Uzmanlık/çalışma alanı en az 3 karakter olmalıdır.' }, { status: 400 })
    }
    if (hp_declaration !== true) {
      return NextResponse.json(
        { error: 'Sağlık profesyoneli olduğunuza dair beyan onayı zorunludur.' },
        { status: 400 }
      )
    }
    if (kvkk_accepted !== true) {
      return NextResponse.json({ error: 'KVKK onayı zorunludur.' }, { status: 400 })
    }

    const admin = createServiceClient()
    const fullName = `${first_name.trim()} ${last_name.trim()}`.trim()

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone,
      },
      app_metadata: { role: 'health_professional' },
    })

    if (error || !data.user) {
      const msg = error?.message?.includes('registered')
        ? 'Bu e-posta zaten kayıtlı.'
        : (error?.message || 'Hesap oluşturulamadı.')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // profiles: rol + beyan alanları senkronla
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        role: 'health_professional',
        full_name: fullName,
        phone,
        phone_verified: true,
        hp_title,
        hp_specialty: hp_specialty.trim(),
        hp_institution: hp_institution ? String(hp_institution).trim() : null,
        hp_declared_at: new Date().toISOString(),
      })
      .eq('id', data.user.id)

    if (profileErr) {
      console.error('[Sağlık Profesyoneli Kayıt] profiles update hatası:', profileErr)
    }

    // Welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/welcome-email')
      await sendWelcomeEmail({
        to: email,
        firstName: first_name.trim() || fullName,
        role: 'health_professional',
      })
    } catch (mailErr) {
      console.error('[Sağlık Profesyoneli Kayıt] Welcome email hatası:', mailErr)
    }

    return NextResponse.json({ success: true, user_id: data.user.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 }
    )
  }
}
