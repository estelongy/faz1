/**
 * Referans sisteminde giden metinler — tek yerde.
 *
 * Üç mesaj var:
 *   1. Referansörün WhatsApp'tan gönderdiği davet  (kendi telefonundan, ücretsiz)
 *   2. Müşteriye giden SMS doğrulama kodu          (Netgsm OTP)
 *   3. Kod üretilince müşteriye giden özet SMS     (sayfayı kapatsa da kodu durur)
 *
 * Dil kuralı: bu mesajlar bir KİŞİDEN gidiyor, kurumdan değil.
 * Kampanya başlığı ("Sakin saat — Skin Booster") iç etikettir, müşteriye yazılmaz.
 * Müşteriyi ilgilendiren: ne kazanacağı, kimin gönderdiği, ne yapması gerektiği.
 */

const KLINIK = 'Dr. İzzet GÖK'

/** "EMEL BERZAN" → "Emel Berzan" · tek kelimeyi de düzeltir. */
export function duzgunAd(ham: string | null | undefined): string {
  if (!ham) return ''
  return ham.trim().split(/\s+/)
    .map(k => k.charAt(0).toLocaleUpperCase('tr') + k.slice(1).toLocaleLowerCase('tr'))
    .join(' ')
}

/**
 * 1) Referansörün WhatsApp daveti.
 *
 * Çıplak link + indirim vaadi dolandırıcılık mesajı gibi durur; kimse tıklamaz.
 * Bu yüzden: tanıdık dille başlar, klinik adı LİNKTEN ÖNCE geçer, ne yapacağı yazar.
 */
export function waDavetMetni(opts: {
  ayricalik: string
  gecerliZaman?: string | null
  url: string
}): string {
  return [
    `Selam 🙂 ${KLINIK}'e gidiyorum, biliyorsun.`,
    '',
    opts.ayricalik.trim(),
    // Saat bilgisi ayrıcalık metninde zaten geçiyorsa tekrarlama.
    // Tam eşleşme yetmez: "10:00-14:00" ikisinde de geçip farklı yazılmış olabilir.
    ...(opts.gecerliZaman && !saatiIceriyor(opts.ayricalik, opts.gecerliZaman)
        ? [opts.gecerliZaman] : []),
    '',
    'Sana da ayarladım. Şuradan numaranı yaz, kodun gelsin:',
    opts.url,
  ].join('\n')
}

/**
 * Ayrıcalık metni, geçerli zaman bilgisini zaten anlatıyor mu?
 * Saat aralıklarını ("10:00-14:00") karşılaştırır: ikisinde de aynı saatler
 * geçiyorsa tekrar yazmaya gerek yok.
 */
function saatiIceriyor(ayricalik: string, zaman: string): boolean {
  const saatler = (t: string) => (t.match(/\d{1,2}[:.]\d{2}/g) ?? []).join('|')
  const z = saatler(zaman)
  if (!z) return ayricalik.includes(zaman)
  return saatler(ayricalik) === z
}

/**
 * 2b) Referansör akışı — müşteriye giden davet + doğrulama SMS'i.
 *
 * Müşteri hiçbir ekran görmüyor; tek aldığı şey bu mesaj. O yüzden üç şeyi
 * birden söylemeli: kim davet etti, ne kazanacak, kodu kime söyleyecek.
 * Rıza da burada alınır ("istemiyorsanız yanıtlamayın").
 */
export function smsDavetDogrulama(opts: {
  musteriAd: string
  ayricalik: string
  kod: string
  /** Kod ömrü (gün) — ayarlardan gelir, sabit yazılmaz. */
  gecerlilikGun?: number
}): string {
  const ad = duzgunAd(opts.musteriAd).split(' ')[0]
  // Ayrıcalık metninden yalnızca oranı al ("...%25 indirim" → "%25").
  // Kampanya detayı (saat, işlem adı) SMS'e girmez — tek kredide kalsın.
  const oran = opts.ayricalik.match(/%\s*\d+/)?.[0].replace(/\s/g, '')
  const fayda = oran ? `${oran} size ozel indirim` : 'size ozel bir ayricalik'
  const sure = opts.gecerlilikGun ? `${opts.gecerlilikGun} gun icinde ` : ''

  return smsSadelestir([
    `Tebrikler ${ad}! ${KLINIK} kliniginde ${fayda} kazandiniz.`,
    `Onay kodu: ${opts.kod}`,
    `Kodu referansiniza iletin, ${sure}kullanin!`,
  ].join('\n'))
}

/**
 * 2) SMS doğrulama kodu.
 *
 * Genel OTP metni ("Gençlik yolculuğuna hoş geldiniz") burada yanlış bağlam —
 * kişi bir davet linki açmış, kayıt olmuyor.
 */
export function smsDogrulamaMetni(kod: string): string {
  return smsSadelestir(`${KLINIK} - tavsiye kodunuz icin dogrulama: ${kod}`)
}

/**
 * 3) Kod üretilince müşteriye giden özet.
 *
 * Sayfayı kapatırsa kodu kaybetmesin; klinikte telefonundan okur.
 * Müşteri yalnızca KISA kısmı söyler — mesajda da o öne çıkar.
 */
export function smsKodOzetMetni(opts: {
  musteriAd: string
  kisaKod: string
  ayricalik: string
  sonKullanma: string      // 'YYYY-MM-DD'
}): string {
  const ad = duzgunAd(opts.musteriAd).split(' ')[0]
  const tarih = tarihYaz(opts.sonKullanma)
  return smsSadelestir([
    `Sayin ${ad}, kodunuz: ${opts.kisaKod}`,
    opts.ayricalik.trim(),
    `${tarih} tarihine kadar gecerli. Klinikte bu kodu soylemeniz yeterli.`,
    KLINIK,
  ].join('\n'))
}

/**
 * SMS gövdesinde Türkçe karakter bırakmayız: Netgsm'de kodlama
 * karışırsa mesaj bozuk gider. Ekranda değil, yalnızca SMS'te uygulanır.
 */
export function smsSadelestir(t: string): string {
  const H: Record<string, string> = {
    'ç':'c','Ç':'C','ğ':'g','Ğ':'G','ı':'i','İ':'I',
    'ö':'o','Ö':'O','ş':'s','Ş':'S','ü':'u','Ü':'U',
    '’':"'", '‘':"'", '“':'"', '”':'"', '–':'-', '—':'-',
  }
  return t.replace(/[çÇğĞıİöÖşŞüÜ’‘“”–—]/g, c => H[c] ?? c)
}

/** '2026-10-13' → '13 Ekim' */
function tarihYaz(iso: string): string {
  const AYLAR = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
                 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik']
  const [, ay, gun] = iso.slice(0, 10).split('-')
  const a = AYLAR[Number(ay) - 1]
  return a ? `${Number(gun)} ${a}` : iso.slice(0, 10)
}
