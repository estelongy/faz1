'use server'

import { cookies } from 'next/headers'
import { redis } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'
import { sendInfoSms, generateOtpCode, normalizePhone, mapNetgsmError } from '@/lib/netgsm'
import { smsSadelestir } from '@/app/klinik/panel/muhasebe/referans-mesajlar'
import { oturumCerez, OTURUM_GUN } from './giris-sabit'
import { smsSiniriAsildi } from './sms-muafiyet'

/**
 * Referansör girişi — şifresiz, SMS ile.
 *
 * Panel eskiden tamamen açıktı: öneği (DH6GOK) bilen herkes açabiliyordu.
 * Şifre koymak yerine SMS doğrulaması kondu — referansör ayda bir girer,
 * parola unutur; telefonunu unutmaz. Doğrulama sonrası çerez 90 gün durur,
 * aynı cihazda bir daha sorulmaz. Başka cihaz/tarayıcı → çerez yok → tekrar sorar.
 *
 * Ayrıca panel adresi unutulabilir: /tavsiye (öneksiz) telefondan öneği bulup
 * kendi paneline yönlendirir.
 *
 * NUMARA SIZDIRMA KORUMASI: kayıtlı olmayan numaraya da "kod gönderildi" denir.
 * Aksi halde numara denenerek kimin referansör olduğu öğrenilebilirdi.
 */

type Gonder = { ok: true } | { ok: false; error: string }
type Dogrula = { ok: true; onek: string } | { ok: false; error: string }

const OTP_TTL_SEC = 5 * 60        // giriş kodu — kısa ömür yeter
const DENEME_SINIR = 5
const ISTEK_SINIR = 3             // aynı numaraya saatte kaç giriş SMS'i

const otpKey = (tel: string) => `ref_giris_otp:${tel}`
const denemeKey = (tel: string) => `ref_giris_deneme:${tel}`
const istekKey = (tel: string) => `ref_giris_istek:${tel}`

/** Telefondan referansör öneğini bulur; yoksa null. */
async function onekBul(tel: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('referral_giris_onek', { p_tel: tel })
  if (error || !data) return null
  return String(data).toUpperCase()
}

/** 1) Telefona giriş kodu gönderir. */
export async function girisKodGonder(hamTel: string): Promise<Gonder> {
  const tel = normalizePhone(hamTel)
  if (!tel) return { ok: false, error: 'Telefon numarası geçersiz.' }

  const gonderilen = Number(await redis.get<number>(istekKey(tel)) ?? 0)
  if (smsSiniriAsildi(tel, gonderilen, ISTEK_SINIR)) {
    return { ok: false, error: 'Çok fazla kod istendi. Bir saat sonra tekrar deneyin.' }
  }

  const onek = await onekBul(tel)

  // Kayıtlı değilse de "gönderildi" denir — numara sızmasın.
  // Kod üretilmez, SMS gitmez, kota da yakılmaz.
  if (!onek) return { ok: true }

  const kod = generateOtpCode()
  const res = await sendInfoSms(tel, smsSadelestir(
    `Referansor paneli giris kodunuz: ${kod}`,
  ))
  if (!res.success) {
    console.error('[referans-giris-sms] Netgsm:', res.error)
    return { ok: false, error: mapNetgsmError(res.code ?? '') }
  }

  const sayac = await redis.incr(istekKey(tel))
  if (sayac === 1) await redis.expire(istekKey(tel), 3600)

  await redis.set(otpKey(tel), { kod, onek }, { ex: OTP_TTL_SEC })
  await redis.del(denemeKey(tel))
  return { ok: true }
}

/** 2) Kodu doğrular, oturum çerezini kurar, öneği döndürür. */
export async function girisKodDogrula(hamTel: string, girilen: string): Promise<Dogrula> {
  const tel = normalizePhone(hamTel)
  if (!tel) return { ok: false, error: 'Telefon numarası geçersiz.' }

  const kayit = await redis.get<{ kod: string; onek: string }>(otpKey(tel))
  if (!kayit) return { ok: false, error: 'Kodun süresi doldu. Yeniden kod isteyin.' }

  const deneme = await redis.incr(denemeKey(tel))
  if (deneme === 1) await redis.expire(denemeKey(tel), OTP_TTL_SEC)
  if (deneme > DENEME_SINIR) {
    await redis.del(otpKey(tel))
    return { ok: false, error: 'Çok fazla yanlış deneme. Yeniden kod isteyin.' }
  }

  if (girilen.replace(/\D/g, '') !== kayit.kod) {
    return { ok: false, error: 'Kod hatalı.' }
  }

  await redis.del(otpKey(tel))
  await redis.del(denemeKey(tel))

  const jar = await cookies()
  jar.set(oturumCerez(kayit.onek), '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/tavsiye',
    maxAge: OTURUM_GUN * 24 * 60 * 60,
  })

  return { ok: true, onek: kayit.onek }
}

/** Panelden çıkış — çerezi siler. */
export async function girisCik(onek: string): Promise<void> {
  const jar = await cookies()
  jar.delete(oturumCerez(onek))
}
