'use server'

import { revalidatePath } from 'next/cache'
import { redis } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'
import { getKlinikStaff } from '@/lib/muhasebe-owner'
import { sendInfoSms, generateOtpCode, normalizePhone, mapNetgsmError } from '@/lib/netgsm'
import { smsSadelestir, duzgunAd } from './referans-mesajlar'

/**
 * Üyelik başlatma — iki adım, referans akışıyla aynı desen:
 *   1) uyelikKodGonder: hastaya SMS onay kodu
 *   2) uyelikOnayla:    personel kodu girer, üyelik başlar
 *
 * Neden doğrulama: kişiye haberi olmadan kademe atamak hem KVKK açısından
 * sorunlu (sağlık verisi özel nitelikli, açık rıza gerekiyor) hem de hasta
 * üye olduğunu bilmeli. SMS; numarayı doğruluyor, zaman damgası ve metin
 * sürümüyle birlikte rıza kanıtı oluşturuyor.
 */

type Sonuc = { ok: true } | { ok: false; error: string }

const OTP_TTL_SEC = 30 * 60
const DENEME_SINIR = 5
const ISTEK_SINIR = 3

const otpKey = (id: string) => `uyelik_otp:${id}`
const denemeKey = (id: string) => `uyelik_deneme:${id}`
const istekKey = (tel: string) => `uyelik_istek:${tel}`

const METIN_SURUM = 'uyelik-v1'

async function ctx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const staff = getKlinikStaff(user?.id)
  if (!user || !staff) return null
  return { supabase, user, ownerId: staff.clinicOwnerId }
}

/** 1) Hastaya üyelik onay kodu gönderir. */
export async function uyelikKodGonder(patientId: string): Promise<Sonuc> {
  const c = await ctx()
  if (!c) return { ok: false, error: 'Yetkisiz' }

  const { data: hasta } = await c.supabase
    .from('internal_patient')
    .select('name, phone, uyelik_onay_at')
    .eq('id', patientId).eq('owner_id', c.ownerId).maybeSingle()

  if (!hasta) return { ok: false, error: 'Hasta bulunamadı.' }
  if (hasta.uyelik_onay_at) return { ok: false, error: 'Bu hasta zaten üye.' }

  const tel = normalizePhone(hasta.phone ?? '')
  if (!tel) return { ok: false, error: 'Hastanın telefon numarası geçersiz veya eksik.' }

  // Sayaç yalnızca OKUNUR; SMS gerçekten gidince artırılır.
  const gonderilen = Number(await redis.get<number>(istekKey(tel)) ?? 0)
  if (gonderilen >= ISTEK_SINIR) {
    return { ok: false, error: `Bu numaraya son bir saatte ${ISTEK_SINIR} kod gönderildi.` }
  }

  const kod = generateOtpCode()
  const ad = duzgunAd(hasta.name).split(' ')[0]
  const mesaj = smsSadelestir([
    `Sayin ${ad}, Dr. Izzet GOK Exclusive Member uyeligi icin onay kodunuz: ${kod}`,
    'Uye olmak istemiyorsaniz kodu paylasmayin.',
  ].join('\n'))

  const res = await sendInfoSms(tel, mesaj)
  if (!res.success) {
    console.error('[uyelik-sms] Netgsm:', res.error)
    return { ok: false, error: mapNetgsmError(res.code ?? '') }
  }

  const sayac = await redis.incr(istekKey(tel))
  if (sayac === 1) await redis.expire(istekKey(tel), 3600)

  await redis.set(otpKey(patientId), { kod, tel }, { ex: OTP_TTL_SEC })
  await redis.del(denemeKey(patientId))
  return { ok: true }
}

/** 2) Personel kodu girer → üyelik başlar. */
export async function uyelikOnayla(patientId: string, girilenKod: string): Promise<Sonuc> {
  const c = await ctx()
  if (!c) return { ok: false, error: 'Yetkisiz' }

  const kayit = await redis.get<{ kod: string; tel: string }>(otpKey(patientId))
  if (!kayit) return { ok: false, error: 'Onay kodunun süresi doldu. Yeniden gönderin.' }

  const deneme = await redis.incr(denemeKey(patientId))
  if (deneme === 1) await redis.expire(denemeKey(patientId), OTP_TTL_SEC)
  if (deneme > DENEME_SINIR) {
    await redis.del(otpKey(patientId))
    return { ok: false, error: 'Çok fazla yanlış deneme. Yeniden kod gönderin.' }
  }

  if (girilenKod.replace(/\D/g, '') !== kayit.kod) {
    return { ok: false, error: 'Kod hatalı.' }
  }

  const { error } = await c.supabase.rpc('uyelik_baslat', {
    p_owner: c.ownerId, p_patient: patientId,
    p_tel: kayit.tel, p_metin_sur: METIN_SURUM,
  })
  if (error) return { ok: false, error: error.message }

  await redis.del(otpKey(patientId))
  await redis.del(denemeKey(patientId))
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

/**
 * Referans kodunu klinik ekranından uygular: ziyaret "geldi" işaretlenir,
 * hakediş ledger'a düşer. Kod arama listesiz — personel kodu yazar.
 */
export async function referansKoduUygula(
  kisaKod: string, hesapTutar?: number,
): Promise<{ ok: true; kod: string; oran: number } | { ok: false; error: string }> {
  const c = await ctx()
  if (!c) return { ok: false, error: 'Yetkisiz' }

  const { data, error } = await c.supabase.rpc('referral_kod_ara', {
    p_owner: c.ownerId, p_arama: kisaKod.trim(),
  })
  if (error) return { ok: false, error: error.message }

  const satirlar = (data ?? []) as Record<string, unknown>[]
  const aktif = satirlar.find(r => r.durum === 'aktif' && r.geldi === null)
  if (!aktif) {
    return {
      ok: false,
      error: satirlar.length ? 'Bu kod daha önce kullanılmış veya süresi dolmuş.' : 'Kod bulunamadı.',
    }
  }

  const ayricalik = String(aktif.teklif_ayricalik ?? '')
  const oran = Number(ayricalik.match(/%\s*(\d+)/)?.[1] ?? 0)
  const indirim = hesapTutar && oran > 0 ? Math.round(hesapTutar * oran / 100) : null

  const { error: hata } = await c.supabase.rpc('referral_isaretle', {
    p_owner: c.ownerId, p_code: aktif.code_id, p_geldi: true,
    p_patient: null, p_treatment: null,
    p_hesap: hesapTutar ?? null, p_indirim: indirim,
  })
  if (hata) return { ok: false, error: hata.message }

  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true, kod: String(aktif.kod), oran }
}
