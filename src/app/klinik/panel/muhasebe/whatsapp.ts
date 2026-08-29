/**
 * WhatsApp randevu bildirimi — wa.me linki üretir.
 *
 * NEDEN API DEĞİL: WhatsApp Business API otomatik gönderim yapabilir ama Meta
 * iş doğrulaması + onaylı şablon + BSP hesabı gerektirir (haftalar, mesaj başı
 * ücret). wa.me yolu bugün çalışır, maliyetsizdir; karşılığında her mesaj bir
 * tık ister — link WhatsApp'ı hazır metinle açar, gönderme kararı hekimdedir.
 * Bu aynı zamanda KVKK açısından daha temiz: mesaj kliniğin kendi hattından,
 * göz kontrolüyle gider.
 */

/** Telefonu wa.me'nin beklediği biçime çevirir: ülke kodlu, sadece rakam. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/\D/g, '')
  if (!d) return null
  // 00 ile başlayan uluslararası önek
  if (d.startsWith('00')) d = d.slice(2)
  // TR yerel biçimler: 0555…(11) → 90555…, 555…(10) → 90555…
  if (d.length === 11 && d.startsWith('0')) d = '90' + d.slice(1)
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d
  // Çok kısa/uzun numaralar güvenilmez — link üretme
  if (d.length < 11 || d.length > 15) return null
  return d
}

const TR_TARIH: Intl.DateTimeFormatOptions = {
  day: 'numeric', month: 'long', weekday: 'long', timeZone: 'Europe/Istanbul',
}
const TR_SAAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
}

export type MesajTuru = 'olusturuldu' | 'hatirlatma'

export interface RandevuMesajBilgi {
  hastaAdi: string
  startAt: string           // ISO
  islemler: string[]        // aynı ziyaretteki işlem adları
  klinikAdi: string
}

/** Randevu mesajının metnini üretir (kopyalanabilir, önizlenebilir). */
export function randevuMesaji(tur: MesajTuru, b: RandevuMesajBilgi): string {
  const d = new Date(b.startAt)
  const tarih = d.toLocaleDateString('tr-TR', TR_TARIH)
  const saat = d.toLocaleTimeString('tr-TR', TR_SAAT)
  // Ad "EMEL BERZAN" gibi tümü büyük gelebiliyor — mesajda yumuşatılır
  const ad = b.hastaAdi.trim().split(/\s+/)
    .map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1).toLocaleLowerCase('tr'))
    .join(' ')
  const islem = b.islemler.filter(Boolean).join(' + ')

  if (tur === 'hatirlatma') {
    return [
      `Merhaba ${ad},`,
      ``,
      `Bugün saat ${saat} randevunuzu hatırlatmak istedik.`,
      islem ? `İşlem: ${islem}` : null,
      ``,
      `Görüşmek üzere.`,
      b.klinikAdi,
    ].filter(v => v !== null).join('\n')
  }

  return [
    `Merhaba ${ad},`,
    ``,
    `Randevunuz oluşturuldu.`,
    `Tarih: ${tarih}`,
    `Saat: ${saat}`,
    islem ? `İşlem: ${islem}` : null,
    ``,
    `Değişiklik için bize yazabilirsiniz.`,
    b.klinikAdi,
  ].filter(v => v !== null).join('\n')
}

/**
 * wa.me linki. Numara yoksa/geçersizse null döner — çağıran taraf butonu
 * "Telefon yok" diye pasif göstermeli, boş kişi seçiciyle kafa karıştırmamalı.
 */
export function whatsappLink(phone: string | null | undefined, mesaj: string): string | null {
  const p = normalizePhone(phone)
  if (!p) return null
  return `https://wa.me/${p}?text=${encodeURIComponent(mesaj)}`
}
