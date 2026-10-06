'use server'

import { headers } from 'next/headers'
import { redis } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'
import { sendInfoSms, generateOtpCode, normalizePhone, mapNetgsmError } from '@/lib/netgsm'
import { smsDogrulamaMetni, smsKodOzetMetni } from '@/app/klinik/panel/muhasebe/referans-mesajlar'

/**
 * Müşteri akışı — şifresiz, iki adım:
 *   1) kodGonder: numarayı alır, SMS doğrulama kodu yollar
 *   2) dogrulaVeKilitle: kodu doğrular, linki kilitler, indirim kodunu üretir
 *
 * Numarayı MÜŞTERİ kendi girer (referansör değil): rıza kanıtlı olur,
 * referansör başkasının numarasını sisteme girmemiş olur (KVKK).
 */

type Gonder = { ok: true } | { ok: false; error: string }
type Dogrula =
  | { ok: true; kod: string; kisa: string; son: string }
  | { ok: false; error: string }

const OTP_TTL_SEC = 5 * 60        // kod 5 dakika geçerli
const DENEME_SINIR = 5            // yanlış kod denemesi
const ISTEK_SINIR = 3             // aynı numaraya saatte kaç SMS

const otpKey = (token: string) => `ref_otp:${token}`
const denemeKey = (token: string) => `ref_otp_deneme:${token}`
const istekKey = (tel: string) => `ref_otp_istek:${tel}`

async function istemciIp(): Promise<string | null> {
  const h = await headers()
  const xff = h.get('x-forwarded-for')
  return xff ? xff.split(',')[0].trim() : h.get('x-real-ip')
}

export async function kodGonder(token: string, hamTel: string): Promise<Gonder> {
  const tel = normalizePhone(hamTel)
  if (!tel) return { ok: false, error: 'Telefon numarası geçersiz.' }

  // Aynı numaraya saatte en fazla 3 SMS
  const istek = await redis.incr(istekKey(tel))
  if (istek === 1) await redis.expire(istekKey(tel), 3600)
  if (istek > ISTEK_SINIR) {
    return { ok: false, error: 'Çok fazla deneme. Bir saat sonra tekrar deneyin.' }
  }

  // Link gerçekten açık mı — boşa SMS gitmesin.
  // Müşteri anonim olduğu için tablo yerine SECURITY DEFINER fonksiyonu okunur.
  const supabase = await createClient()
  const { data: davet } = await supabase.rpc('referral_davet_goster', { p_token: token })
  const d = (davet ?? null) as Record<string, unknown> | null

  if (!d) return { ok: false, error: 'Bağlantı geçersiz.' }
  if (d.kilitli) return { ok: false, error: 'Bu bağlantı daha önce kullanılmış.' }
  if (!d.gecerli) {
    return { ok: false, error: 'Bağlantının süresi dolmuş. Sizi davet edenden yeni bağlantı isteyin.' }
  }

  const kod = generateOtpCode()
  // Genel OTP metni ("Gençlik yolculuğuna hoş geldiniz") burada yanlış bağlam:
  // kişi kayıt olmuyor, bir davet linki açmış.
  const res = await sendInfoSms(tel, smsDogrulamaMetni(kod))
  if (!res.success) {
    console.error('[referans-otp] Netgsm:', res.error)
    return { ok: false, error: mapNetgsmError(res.code ?? '') }
  }

  await redis.set(otpKey(token), { kod, tel }, { ex: OTP_TTL_SEC })
  await redis.del(denemeKey(token))
  return { ok: true }
}

export async function dogrulaVeKilitle(
  token: string, ad: string, girilenKod: string,
): Promise<Dogrula> {
  const temizAd = ad.trim()
  if (temizAd.length < 2) return { ok: false, error: 'Adınızı yazın.' }

  const kayit = await redis.get<{ kod: string; tel: string }>(otpKey(token))
  if (!kayit) {
    return { ok: false, error: 'Doğrulama kodunun süresi doldu. Yeniden kod isteyin.' }
  }

  const deneme = await redis.incr(denemeKey(token))
  if (deneme === 1) await redis.expire(denemeKey(token), OTP_TTL_SEC)
  if (deneme > DENEME_SINIR) {
    await redis.del(otpKey(token))
    return { ok: false, error: 'Çok fazla yanlış deneme. Yeniden kod isteyin.' }
  }

  if (girilenKod.replace(/\D/g, '') !== kayit.kod) {
    return { ok: false, error: 'Kod hatalı.' }
  }

  // Kilitleme ve indirim kodu üretimi tek transaction'da, satır kilidiyle.
  const supabase = await createClient()
  const { data: davet } = await supabase.rpc('referral_davet_goster', { p_token: token })
  const d = (davet ?? null) as Record<string, unknown> | null
  const { data, error } = await supabase.rpc('referral_kilitle', {
    p_token: token,
    p_ad: temizAd,
    p_tel: kayit.tel,
    p_metin_surum: 'musteri-v1',
    p_ip: await istemciIp(),
  })

  if (error) return { ok: false, error: error.message }

  const row = Array.isArray(data) ? data[0] as Record<string, unknown> : null
  if (!row?.kod) return { ok: false, error: 'Kod üretilemedi.' }

  await redis.del(otpKey(token))
  await redis.del(denemeKey(token))

  // Kod özeti — müşteri sayfayı kapatsa da kodu telefonunda kalsın.
  // Gönderilemezse akış bozulmaz: kod zaten ekranda.
  try {
    await sendInfoSms(kayit.tel, smsKodOzetMetni({
      musteriAd: temizAd,
      kisaKod: String(row.kisa),
      ayricalik: (d?.ayricalik as string) ?? '',
      sonKullanma: String(row.son_kullanma),
    }))
  } catch (err) {
    console.error('[referans-kod-sms]', err)
  }

  return {
    ok: true,
    kod: String(row.kod),
    kisa: String(row.kisa),
    son: String(row.son_kullanma),
  }
}
