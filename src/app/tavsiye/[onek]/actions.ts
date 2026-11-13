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
  onek: string, offerId: string, ad: string, hamTel: string, islemNotu?: string,
  /** Referansörün kendi puanından verdiği ek indirim (TL). Klinik %10'un üstü. */
  ekstraIndirim?: number,
): Promise<Baslat> {
  const temizAd = ad.trim()
  // Ad SOYAD şart: klinik kimi bekleyeceğini bilmeli. Ekran da kontrol ediyor
  // ama istemci atlanabilir.
  if (temizAd.split(/\s+/).filter(p => p.length > 1).length < 2) {
    return { ok: false, error: 'Ad ve soyadı birlikte yazın.' }
  }

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
    p_not: islemNotu?.trim() || null,
    // Bakiye kontrolü RPC'de: yetmezse davet hiç açılmaz, klinikte
    // hasta karşısında sürpriz olmasın.
    p_ekstra: Number.isFinite(ekstraIndirim) ? Math.max(ekstraIndirim!, 0) : 0,
  })
  if (error) return { ok: false, error: error.message }

  const row = Array.isArray(data) ? data[0] as { token?: string } | undefined : null
  if (!row?.token) return { ok: false, error: 'Davet oluşturulamadı.' }

  // Kampanya ve referansör adı mesajda geçsin
  const { data: davet } = await supabase.rpc('referral_davet_goster', { p_token: row.token })
  const d = (davet ?? null) as Record<string, unknown> | null

  // Kampanyanın kendi oranı yoksa ("Referans Ekle" gibi serbest teklifler),
  // oran referansörün müşteri aralığından gelir — müşteri somut bir sayı görsün.
  const ayricalikMetni = (d?.ayricalik as string) ?? ''
  let indirimOran: number | null = null
  if (!/%\s*\d+/.test(ayricalikMetni)) {
    const { data: panel } = await supabase.rpc('referral_panel', { p_onek: onek })
    const p = (panel ?? null) as Record<string, unknown> | null
    const max = Number(p?.musteri_max)
    if (Number.isFinite(max) && max > 0) indirimOran = max
  }

  const kod = generateOtpCode()
  const res = await sendInfoSms(tel, smsDavetDogrulama({
    musteriAd: temizAd,
    ayricalik: ayricalikMetni,
    kod,
    indirimOran,
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

    // Kampanyanın kendi oranı yoksa ("Referans Ekle" gibi serbest teklifler),
    // oran referansörün müşteri aralığından gelir — müşteri "size özel indirim"
    // gibi boş bir söz değil, somut bir oran görsün.
    const ayricalik = (d?.ayricalik as string) ?? ''
    let indirimOran: number | null = null
    if (!/%\s*\d+/.test(ayricalik)) {
      const { data: panel } = await supabase.rpc('referral_panel', { p_onek: onek })
      const p = (panel ?? null) as Record<string, unknown> | null
      const max = Number(p?.musteri_max)
      if (Number.isFinite(max) && max > 0) indirimOran = max
    }

    await sendInfoSms(kayit.tel, smsKodOzetMetni({
      musteriAd: (d?.musteri_ad as string) ?? '',
      kisaKod: String(row.kisa),
      ayricalik,
      sonKullanma: String(row.son_kullanma),
      referansor: (d?.referansor as string) ?? null,
      indirimOran,
    }))
  } catch (err) {
    console.error('[referans-kod-sms]', err)
  }

  revalidatePath(`/tavsiye/${onek}`)
  return { ok: true, kod: String(row.kod), kisa: String(row.kisa) }
}

/**
 * Referansörün aday önerisi.
 *
 * Eskiden burada "başvuru linkini kopyala" vardı: link sabitti, sınırsızdı,
 * gruba atılabiliyordu ve kimin kimi davet ettiği kayıtlı değildi.
 *
 * Artık referansör adayı TANITIYOR, link almıyor. Klinik tanıtımı okuyup
 * karar veriyor; onaylanırsa adaya SMS gidiyor.
 *
 * Doğrulamalar DB tarafında da var (referral_aday_oner) — ekran atlanabilir.
 */
export async function adayOner(
  onek: string, ad: string, tel: string,
  tip: 'bireysel' | 'isletme', tanitim: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('referral_aday_oner', {
    p_onek: onek,
    p_ad: ad,
    p_tel: tel,
    p_tip: tip,
    p_tanitim: tanitim,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/tavsiye/${onek}`)
  return { ok: true }
}
