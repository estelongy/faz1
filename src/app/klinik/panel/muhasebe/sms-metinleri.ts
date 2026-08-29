/**
 * Hastaya giden SMS metinleri — TEK KAYNAK.
 *
 * Metni değiştirmek isteyen buraya bakar; hem randevu oluşturma (actions.ts)
 * hem sabah hatırlatma cron'u (api/cron/randevu-hatirlatma) buradan okur.
 *
 * Not: Netgsm giden SMS ucu encoding:'TR' ile Türkçe karakter destekler.
 * TR kodlamada segment 70 karakter — aşağıdaki metinler ~3 segment (3 kredi).
 */

/** Klinik kimliği — SMS başlığı DRIGOK, metinde tam ad geçer. */
export const KLINIK_ADI = 'Dr. İzzet GÖK Medikal Estetik Kliniği'

/** Hastanın ulaşabileceği WhatsApp hattı. */
export const ILETISIM_LINK = 'https://wa.me/905524228485'

/** "EMEL BERZAN" → "Emel Berzan" (veritabanında tümü büyük olabiliyor). */
export function duzgunAd(ham: string | null | undefined): string {
  return (ham ?? '').trim().split(/\s+/)
    .map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1).toLocaleLowerCase('tr'))
    .join(' ')
}

/** Randevu oluşturulduğunda gönderilen bilgi mesajı. */
export function smsRandevuOlusturuldu(ad: string, tarih: string, saat: string): string {
  return `Sayın ${ad}, ${KLINIK_ADI}'nde işlem randevunuz oluşturulmuştur. `
    + `Randevu Özeti: ${tarih}, Saat ${saat}. `
    + `Değişiklik veya Bilgi İçin Bize ulaşabilirsiniz. ${ILETISIM_LINK}`
}

/** Tekrarlayan paket planlandığında: tek özet mesaj (her seans için ayrı SMS gitmez). */
export function smsPaketPlanlandi(ad: string, seansSayisi: number, tarih: string, saat: string): string {
  return `Sayın ${ad}, ${KLINIK_ADI}'nde ${seansSayisi} seanslık işlem randevunuz oluşturulmuştur. `
    + `İlk Randevu: ${tarih}, Saat ${saat}. `
    + `Değişiklik veya Bilgi İçin Bize ulaşabilirsiniz. ${ILETISIM_LINK}`
}

/** Randevu günü sabah gönderilen hatırlatma. */
export function smsHatirlatma(ad: string, saat: string): string {
  return `Sayın ${ad}, ${KLINIK_ADI}'nde bugün Saat ${saat} işlem randevunuz bulunmaktadır. `
    + `Değişiklik veya Bilgi İçin Bize ulaşabilirsiniz. ${ILETISIM_LINK}`
}
