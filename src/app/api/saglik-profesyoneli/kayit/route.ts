import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Sağlık Profesyoneli kayıt akışı (kurumsal giriş üzerinden).
 * Beyan bazlı — diploma/uzmanlık doğrulaması yok.
 * Erişim: /panel + Akademi (sadece izleme).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Eksik alanlar.' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 })
    }

    const admin = createServiceClient()

    // app_metadata.role doğrudan health_professional olarak set ediliyor
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
      app_metadata: { role: 'health_professional' },
    })

    if (error || !data.user) {
      const msg = error?.message?.includes('registered')
        ? 'Bu e-posta zaten kayıtlı.'
        : (error?.message || 'Hesap oluşturulamadı.')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // profiles.role'ü de health_professional olarak senkronla
    await admin
      .from('profiles')
      .update({ role: 'health_professional', full_name })
      .eq('id', data.user.id)

    // Welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/welcome-email')
      await sendWelcomeEmail({
        to: email,
        firstName: full_name.split(' ')[0] || full_name,
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
