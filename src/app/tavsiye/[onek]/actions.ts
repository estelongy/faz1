'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redis } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'
import { sendInfoSms, generateOtpCode, normalizePhone, mapNetgsmError } from '@/lib/netgsm'
import { smsDavetDogrulama, smsKodOzetMetni } from '@/app/klinik/panel/muhasebe/referans-mesajlar'

/**
 * Referansör akışı — iki adım:
 *   1) davetBaslat: ad + telefon girer, müşteriye doğrulama SMS'i gider
 *   2) kodDogrula:  referansör müşteriden kodu alır, girer → altın kod oluşur
 *
 * Doğrulama kalkmıyor: numara doğrulanmadan kod üretilmez (aynı telefonun
 * defalarca kaydedilmesini engeller). Ama kodu REFERANSÖR giriyor — müşteri
 * hiçbir ekran görmüyor, sadece SMS alıyor.
 */

type Baslat = { ok: true; token: string } | { ok: false; error: string }
type Dogrula =
  | { ok: true; kod: string; kisa: string }
  | { ok: false; error: string }

const OTP_TTL_SEC = 30 * 60   // referansörün arayıp sorması zaman alır
const DENEME_SINIR = 5
const ISTEK_SINIR = 3         // aynı numaraya saatte kaç SMS

const otpKey = (token: string) => `ref_otp:${token}`
const denemeKey = (token: string) => `ref_otp_deneme:${token}`
const istekKey = (tel: string) => `ref_otp_istek:${tel}`

async function istemciIp(): Promise<string | null> {
  const h = await headers()
  const xff = h.get('x-forwarded-for')
  return xff ? xff.split(',')[0].trim() : h.get('x-real-ip')
}

/** 1) Referansör ad + telefon girer → müşteriye doğrulama SMS'i gider. */
export async function davetBaslat(
  onek: string, offerId: string, ad: string, hamTel: string,
): Promise<Baslat> {
  const temizAd = ad.trim()
  if (temizAd.length < 2) return { ok: false, error: 'Adını yazın.' }

  const tel = normalizePhone(hamTel)
  if (!tel) return { ok: false, error: 'Telefon numarası geçersiz.' }

  // Aynı numaraya saatte en fazla N SMS.
  // Sayaç yalnızca OKUNUR; artırma SMS gerçekten gidince yapılır — yoksa
  // DB hatası veya SMS arızasında kota boşa yanıyordu.
  const gonderilen = Number(await redis.get<number>(istekKey(tel)) ?? 0)
  if (gonderilen >= ISTEK_SINIR) {
    return {
      ok: false,
      error: `Bu numaraya son bir saatte ${ISTEK_SINIR} kod gönderildi. Biraz sonra tekrar deneyin.`,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('referral_davet_baslat', {
    p_onek: onek, p_offer: offerId, p_ad: temizAd, p_tel: hamTel,
  })
  if (error) return { ok: false, error: error.message }

  const row = Array.isArray(data) ? data[0] as { token?: string } | undefined : null
  if (!row?.token) return { ok: false, error: 'Davet oluşturulamadı.' }

  // Kampanya ve referansör adı mesajda geçsin
  const { data: davet } = await supabase.rpc('referral_davet_goster', { p_token: row.token })
  const d = (davet ?? null) as Record<string, unknown> | null

  // Kod ömrü ayarlardan; SMS'te "7 gun gecerli" diye sabit yazmıyoruz.
  const { data: ayar } = await supabase
    .from('referral_settings').select('kod_omru_gun').maybeSingle()

  const kod = generateOtpCode()
  const res = await sendInfoSms(tel, smsDavetDogrulama({
    musteriAd: temizAd,
    ayricalik: (d?.ayricalik as string) ?? '',
    gecerlilikGun: ayar?.kod_omru_gun ?? undefined,
    kod,
  }))
  if (!res.success) {
    console.error('[referans-davet-sms] Netgsm:', res.error)
    return { ok: false, error: mapNetgsmError(res.code ?? '') }
  }

  // SMS gitti — kotayı şimdi yak.
  const sayac = await redis.incr(istekKey(tel))
  if (sayac === 1) await redis.expire(istekKey(tel), 3600)

  await redis.set(otpKey(row.token), { kod, tel }, { ex: OTP_TTL_SEC })
  await redis.del(denemeKey(row.token))

  revalidatePath(`/tavsiye/${onek}`)
  return { ok: true, token: row.token }
}

/** 2) Referansör müşteriden aldığı kodu girer → altın kod üretilir. */
export async function kodDogrula(
  onek: string, token: string, girilenKod: string,
): Promise<Dogrula> {
  const kayit = await redis.get<{ kod: string; tel: string }>(otpKey(token))
  if (!kayit) {
    return { ok: false, error: 'Doğrulama süresi doldu. Yeniden davet gönderin.' }
  }

  const deneme = await redis.incr(denemeKey(token))
  if (deneme === 1) await redis.expire(denemeKey(token), OTP_TTL_SEC)
  if (deneme > DENEME_SINIR) {
    await redis.del(otpKey(token))
    return { ok: false, error: 'Çok fazla yanlış deneme. Yeniden davet gönderin.' }
  }

  if (girilenKod.replace(/\D/g, '') !== kayit.kod) {
    return { ok: false, error: 'Kod hatalı.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('referral_kilitle_aday', {
    p_token: token, p_metin_surum: 'referansor-v1', p_ip: await istemciIp(),
  })
  if (error) return { ok: false, error: error.message }

  const row = Array.isArray(data) ? data[0] as Record<string, unknown> : null
  if (!row?.kod) return { ok: false, error: 'Kod üretilemedi.' }

  await redis.del(otpKey(token))
  await redis.del(denemeKey(token))

  // Altın kodu müşteriye SMS'le gönder — referansör söylemese de elinde olsun.
  // Gönderilemezse akış bozulmaz: kod referansörün ekranında zaten var.
  try {
    const { data: davet } = await supabase.rpc('referral_davet_goster', { p_token: token })
    const d = (davet ?? null) as Record<string, unknown> | null
    await sendInfoSms(kayit.tel, smsKodOzetMetni({
      musteriAd: (d?.musteri_ad as string) ?? '',
      kisaKod: String(row.kisa),
      ayricalik: (d?.ayricalik as string) ?? '',
      sonKullanma: String(row.son_kullanma),
    }))
  } catch (err) {
    console.error('[referans-kod-sms]', err)
  }

  revalidatePath(`/tavsiye/${onek}`)
  return { ok: true, kod: String(row.kod), kisa: String(row.kisa) }
}
