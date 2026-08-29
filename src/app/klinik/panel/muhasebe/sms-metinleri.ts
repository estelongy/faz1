/**
 * Hastaya giden SMS metinleri.
 *
 * Şablonlar klinik başına internal_sms_settings tablosunda tutulur; satır
 * yoksa aşağıdaki varsayılanlar kullanılır. Metinde yer tutucular:
 *   {ad} {tarih} {saat} {klinik} {link} {seans}
 *
 * Not: Netgsm giden SMS ucu encoding:'TR' ile Türkçe karakter destekler.
 * TR kodlamada segment 70 karakter — varsayılan metinler ~3 segment.
 */

/** Klinik kimliği — SMS başlığı DRIGOK, metinde tam ad geçer. */
export const KLINIK_ADI = 'Dr. İzzet GÖK Medikal Estetik Kliniği'

/** Hastanın ulaşabileceği WhatsApp hattı. */
export const ILETISIM_LINK = 'https://wa.me/905524228485'

export const VARSAYILAN_OLUSTURMA =
  "Sayın {ad}, {klinik}'nde işlem randevunuz oluşturulmuştur. "
  + 'Randevu Özeti: {tarih}, Saat {saat}. '
  + 'Değişiklik veya Bilgi İçin Bize ulaşabilirsiniz. {link}'

export const VARSAYILAN_PAKET =
  "Sayın {ad}, {klinik}'nde {seans} seanslık işlem randevunuz oluşturulmuştur. "
  + 'İlk Randevu: {tarih}, Saat {saat}. '
  + 'Değişiklik veya Bilgi İçin Bize ulaşabilirsiniz. {link}'

export const VARSAYILAN_HATIRLATMA =
  "Sayın {ad}, {klinik}'nde yarın Saat {saat} işlem randevunuz bulunmaktadır. "
  + 'Değişiklik veya Bilgi İçin Bize ulaşabilirsiniz. {link}'

/** Klinik ayarları (tablodan gelir; alanlar boşsa varsayılan devreye girer). */
export interface SmsAyar {
  klinik_adi?: string | null
  iletisim_link?: string | null
  sablon_olusturma?: string | null
  sablon_paket?: string | null
  sablon_hatirlatma?: string | null
  hatirlatma_saati?: number | null
  hatirlatma_gun_once?: number | null
  olusturma_aktif?: boolean | null
  hatirlatma_aktif?: boolean | null
}

/** "EMEL BERZAN" → "Emel Berzan" (veritabanında tümü büyük olabiliyor). */
export function duzgunAd(ham: string | null | undefined): string {
  return (ham ?? '').trim().split(/\s+/)
    .map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1).toLocaleLowerCase('tr'))
    .join(' ')
}

/** Şablondaki yer tutucuları doldurur. Tanımsız alan boş string olur. */
export function doldur(sablon: string, degerler: Record<string, string | number>): string {
  return sablon.replace(/\{(\w+)\}/g, (_, k: string) => String(degerler[k] ?? '')).trim()
}

interface Bilgi {
  ad: string
  tarih?: string
  saat: string
  seans?: number
  ayar?: SmsAyar | null
}

function ortak(b: Bilgi) {
  return {
    ad: b.ad,
    tarih: b.tarih ?? '',
    saat: b.saat,
    seans: b.seans ?? '',
    klinik: b.ayar?.klinik_adi?.trim() || KLINIK_ADI,
    link: b.ayar?.iletisim_link?.trim() || ILETISIM_LINK,
  }
}

/** Randevu oluşturulduğunda gönderilen bilgi mesajı. */
export function smsRandevuOlusturuldu(ad: string, tarih: string, saat: string, ayar?: SmsAyar | null): string {
  const sablon = ayar?.sablon_olusturma?.trim() || VARSAYILAN_OLUSTURMA
  return doldur(sablon, ortak({ ad, tarih, saat, ayar }))
}

/** Tekrarlayan paket planlandığında: tek özet mesaj (her seans için ayrı SMS gitmez). */
export function smsPaketPlanlandi(ad: string, seansSayisi: number, tarih: string, saat: string, ayar?: SmsAyar | null): string {
  const sablon = ayar?.sablon_paket?.trim() || VARSAYILAN_PAKET
  return doldur(sablon, ortak({ ad, tarih, saat, seans: seansSayisi, ayar }))
}

/** Randevudan önce gönderilen hatırlatma. */
export function smsHatirlatma(ad: string, saat: string, ayar?: SmsAyar | null, tarih?: string): string {
  const sablon = ayar?.sablon_hatirlatma?.trim() || VARSAYILAN_HATIRLATMA
  return doldur(sablon, ortak({ ad, saat, tarih, ayar }))
}

/** TR kodlamada segment 70 karakter — ekranda maliyet göstermek için. */
export function segmentSayisi(metin: string): number {
  return Math.max(1, Math.ceil(metin.length / 70))
}
