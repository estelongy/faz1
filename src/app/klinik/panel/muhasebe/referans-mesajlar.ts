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
 * "İZZET GÖK" → "İzzet G." · SMS'te tam soyadı yazmayız.
 *
 * Müşteriye de referansöre de bu biçimde hitap edilir: ad tanınır kalır,
 * soyadı açıkta kalmaz. Tek kelimelik ad olduğu gibi döner.
 */
export function adSoyadBasHarf(ham: string | null | undefined): string {
  const t = duzgunAd(ham)
  if (!t) return ''
  const p = t.split(' ')
  return p.length < 2 ? p[0] : `${p[0]} ${p[1].charAt(0)}.`
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
 * 1b) Referansörün, tanıdığını REFERANSÖR OLMAYA çağıran WhatsApp metni.
 *
 * Bu bir form linki değil, bir davet: karşıdaki kişi tanıdığının adını
 * görüyor, ne olduğunu ve ne kazanacağını okuyor, sonra linke basıyor.
 * "Buradan başvuru yapabilirsin" demek daveti form doldurmaya indirger.
 *
 * Onay adımı bilerek yazılıyor: kişi başvurunca hemen referansör olmuyor,
 * klinik onaylıyor. Beklenti doğru kurulsun.
 */
export function waReferansorDavetMetni(opts: {
  /** Daveti gönderen referansörün adı. */
  referansorAd: string
  url: string
}): string {
  // WhatsApp metni — SMS değil, Türkçe karakter serbest (smsSadelestir YOK).
  const ad = duzgunAd(opts.referansorAd).split(' ')[0]
  return [
    `${KLINIK} kliniğinin tavsiye programındayım.`,
    '',
    'Tanıdıklarıma özel indirim tanımlayabiliyorum; onlar işlem yaptırınca ben de puan kazanıyorum. Sana da açabilirim.',
    '',
    'Kendi tavsiye panelin olur: kime indirim verdiğini, ne kazandığını telefonundan takip edersin. Üyelik ücreti yok, zorunluluk yok.',
    '',
    'Katılmak istersen buradan bilgilerini bırak, klinik onaylasın:',
    opts.url,
    '',
    `— ${ad}`,
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
  /** Kampanyanın kendi oranı yoksa dışarıdan verilen indirim yüzdesi. */
  indirimOran?: number | null
}): string {
  const ad = adSoyadBasHarf(opts.musteriAd)
  // Ayrıcalık metninden yalnızca oranı al ("...%25 indirim" → "%25").
  // Kampanya detayı (saat, işlem adı) SMS'e girmez — tek kredide kalsın.
  // Oranı olmayan serbest tekliflerde çağıran taraf indirimOran geçer.
  const oran = opts.ayricalik.match(/%\s*\d+/)?.[0].replace(/\s/g, '')
    ?? (opts.indirimOran ? `%${Math.round(opts.indirimOran)}` : undefined)
  const fayda = oran ? `size ozel ${oran} indirim` : 'size ozel bir ayricalik'

  return smsSadelestir([
    `Tebrikler! ${ad} - ${KLINIK} kliniginde ${fayda} kazandiniz.`,
    `REF - ${opts.kod} - Kodu ile ALTIN KODUNUZU Hemen Alabilirsiniz!`,
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
  /** Kodu gönderen referansör — müşteri kimden geldiğini görsün. */
  referansor?: string | null
  /** Kampanyanın kendi oranı yoksa dışarıdan verilen indirim yüzdesi. */
  indirimOran?: number | null
}): string {
  const ad = adSoyadBasHarf(opts.musteriAd)
  const tarih = tarihYaz(opts.sonKullanma)
  // Ayrıcalık metninden yalnızca oranı al ("...%25 indirim" → "%25").
  // Kampanya detayı (saat, işlem adı) SMS'e girmez — mesaj tek kredide kalsın.
  // Kampanyanın kendi oranı yoksa çağıran taraf indirimOran geçer; müşteriye
  // "size özel indirim" gibi boş bir söz değil, somut bir oran gider.
  const oran = opts.ayricalik.match(/%\s*\d+/)?.[0].replace(/\s/g, '')
    ?? (opts.indirimOran ? `%${Math.round(opts.indirimOran)}` : undefined)
  const fayda = oran ? `${oran} indirim tanimli` : 'size ozel indirim tanimli'
  // Referansör adı da baş harfli: "Deniz Hanim" → "Deniz H."
  // Panel öneki (DH6GOK) ASLA yazılmaz — o, referansörün panel adresi.
  const ref = adSoyadBasHarf(opts.referansor)
  return smsSadelestir([
    `Sayin ${ad}, ${KLINIK} kliniginde ${fayda} ALTIN KODUNUZ: ${opts.kisaKod}`,
    `Indirim firsati icin son tarih ${tarih}.${ref ? ` Ref: ${ref}` : ''}`,
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
