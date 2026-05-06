import { NextRequest, NextResponse } from 'next/server'
import { redis, otpPerMinute, otpPerHour } from '@/lib/redis'
import { sendOtpSms, generateOtpCode, normalizePhone } from '@/lib/netgsm'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Admin'in kendi telefonuna OTP gönderir. Telefon DB'den okunur (kullanıcı veremez).
 */
export async function POST(req: NextRequest) {
  void req // unused but Next.js POST signature requires it
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
    }
    const role = (user.app_metadata as Record<string, string>)?.role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    const admin = createServiceClient()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const phone = authUser?.user?.phone
    if (!phone) {
      return NextResponse.json(
        { error: 'Hesabınızda kayıtlı telefon yok.' },
        { status: 400 }
      )
    }

    const normalized = normalizePhone(phone)
    if (!normalized) {
      return NextResponse.json({ error: 'Telefon formatı geçersiz' }, { status: 400 })
    }

    const minuteRes = await otpPerMinute.limit(normalized)
    if (!minuteRes.success) {
      return NextResponse.json(
        { error: 'Çok sık deneme. Lütfen 3 dakika bekleyin.' },
        { status: 429, headers: { 'Retry-After': '180' } }
      )
    }
    const hourRes = await otpPerHour.limit(normalized)
    if (!hourRes.success) {
      return NextResponse.json(
        { error: 'Saatlik OTP isteği limiti doldu.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }

    const code = generateOtpCode()
    await redis.set(`otp:code:${normalized}`, code, { ex: 300 })
    await redis.del(`otp:attempts:${normalized}`)

    const smsRes = await sendOtpSms(normalized, code)
    if (!smsRes.success) {
      await redis.del(`otp:code:${normalized}`)
      console.error('[Admin OTP Send] Netgsm hatası:', smsRes.error)
      return NextResponse.json({ error: 'SMS gönderilemedi.' }, { status: 500 })
    }

    // Maskelenmiş telefonu döndür: +9054*****003
    const masked = normalized.replace(/^(\d{4})\d+(\d{3})$/, '$1*****$2')

    return NextResponse.json({ success: true, masked })
  } catch (err) {
    console.error('[Admin OTP Send] Beklenmedik hata:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
