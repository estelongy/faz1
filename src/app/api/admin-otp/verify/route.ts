import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { normalizePhone } from '@/lib/netgsm'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { markAdminOtpVerified } from '@/lib/admin-otp'

/**
 * Admin login için ek SMS OTP doğrulama.
 *
 * Güvenlik:
 *  - Kullanıcı zaten Supabase Auth ile giriş yapmış olmalı
 *  - Kullanıcının rolü admin olmalı (app_metadata.role)
 *  - Kod, kullanıcının auth.users.phone numarasına gönderilmiş olmalı
 *  - Kullanıcı kendi telefonuna gönderilmemiş bir koda erişemez
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code?: string }
    if (!code) {
      return NextResponse.json({ error: 'Kod gerekli' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
    }

    const role = (user.app_metadata as Record<string, string>)?.role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    // Telefonu service client ile çek (auth.users.phone)
    const admin = createServiceClient()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const phone = authUser?.user?.phone
    if (!phone) {
      return NextResponse.json(
        { error: 'Hesabınızda kayıtlı telefon yok. Yöneticiyle iletişime geçin.' },
        { status: 400 }
      )
    }

    const normalized = normalizePhone(phone)
    if (!normalized) {
      return NextResponse.json({ error: 'Telefon formatı geçersiz' }, { status: 400 })
    }

    const codeKey = `otp:code:${normalized}`
    const attemptsKey = `otp:attempts:${normalized}`

    const attemptsRaw = await redis.get<number>(attemptsKey)
    const attempts = attemptsRaw ?? 0
    if (attempts >= 5) {
      await redis.del(codeKey)
      await redis.del(attemptsKey)
      return NextResponse.json(
        { error: 'Çok fazla yanlış deneme. Yeni kod isteyin.' },
        { status: 429 }
      )
    }

    const storedCode = await redis.get<string>(codeKey)
    if (!storedCode) {
      return NextResponse.json(
        { error: 'Kod süresi doldu veya geçersiz. Yeni kod isteyin.' },
        { status: 400 }
      )
    }

    if (String(storedCode) !== String(code).trim()) {
      await redis.incr(attemptsKey)
      await redis.expire(attemptsKey, 300)
      const remaining = Math.max(0, 5 - (attempts + 1))
      return NextResponse.json(
        { error: `Kod hatalı. Kalan deneme: ${remaining}` },
        { status: 400 }
      )
    }

    // Başarılı — kodu sil, admin OTP session'ını işaretle
    await redis.del(codeKey)
    await redis.del(attemptsKey)
    await markAdminOtpVerified(user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admin OTP Verify] Beklenmedik hata:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
