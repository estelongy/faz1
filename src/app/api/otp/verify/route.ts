import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { normalizePhone } from '@/lib/netgsm'
import { createClient } from '@/lib/supabase/server'

/**
 * OTP kodu doğrula.
 *
 * Akış:
 *   1. Telefon normalize edilir
 *   2. Attempts sayacı 5'e ulaştıysa kod silinir, 429 döner
 *   3. Redis'ten kod okunur, yoksa süresi doldu
 *   4. Eşleşmezse attempts incr + TTL 300 set, 400 döner
 *   5. Eşleşirse kod ve attempts silinir, success döner
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json() as { phone?: string; code?: string }

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Telefon ve kod gerekli' },
        { status: 400 }
      )
    }

    const normalized = normalizePhone(phone)
    if (!normalized) {
      return NextResponse.json(
        { error: 'Geçersiz telefon numarası' },
        { status: 400 }
      )
    }

    const codeKey = `otp:code:${normalized}`
    const attemptsKey = `otp:attempts:${normalized}`

    // 1. Attempts kontrolü
    const attemptsRaw = await redis.get<number>(attemptsKey)
    const attempts = attemptsRaw ?? 0
    if (attempts >= 5) {
      // Kodu sil, kullanıcı yeni kod istemek zorunda
      await redis.del(codeKey)
      await redis.del(attemptsKey)
      return NextResponse.json(
        { error: 'Çok fazla yanlış deneme. Yeni kod isteyin.' },
        { status: 429 }
      )
    }

    // 2. Kod Redis'te var mı?
    const storedCode = await redis.get<string>(codeKey)
    if (!storedCode) {
      return NextResponse.json(
        { error: 'Kod süresi doldu veya geçersiz. Yeni kod isteyin.' },
        { status: 400 }
      )
    }

    // 3. Kod eşleşiyor mu? (string karşılaştırma — Upstash redis otomatik string döner)
    if (String(storedCode) !== String(code).trim()) {
      // Yanlış deneme: incr + TTL koruması
      await redis.incr(attemptsKey)
      await redis.expire(attemptsKey, 300)
      const remaining = Math.max(0, 5 - (attempts + 1))
      return NextResponse.json(
        { error: `Kod hatalı. Kalan deneme: ${remaining}` },
        { status: 400 }
      )
    }

    // 4. Başarılı — kod ve deneme sayacını sil
    await redis.del(codeKey)
    await redis.del(attemptsKey)

    // Oturum açıksa profile'i güncelle (phone + phone_verified=true)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ phone: normalized, phone_verified: true })
          .eq('id', user.id)
      }
    } catch (profileErr) {
      // Profile update hatası akışı durdurmaz
      console.error('[OTP Verify] Profile update error:', profileErr)
    }

    return NextResponse.json({ success: true, phone: normalized })
  } catch (err) {
    console.error('[OTP Verify] Beklenmedik hata:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
