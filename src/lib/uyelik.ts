/**
 * Estelongy Exclusive Member — kademe motoru.
 *
 * Tasarım ve gerekçeler: docs/uyelik-sistemi.md
 *
 * Özet:
 *   - Dayanak TAHSİLAT (işlem tutarı değil). İşleme bağlı ödeme o işlemin
 *     gününe, serbest ödeme kendi tarihine yazılır (taksit şişmesini önler).
 *   - Aynı gün toplanan tahsilat TEK ZİYARET sayılır.
 *   - Ziyaretler büyükten küçüğe sıralanır, sıra çarpanı uygulanır.
 *   - Tek ziyaret daha yüksek eşik öder; sadakat indirimi eşiğin kendisinde.
 */

export type Kademe = 'primula' | 'elita' | 'optima' | 'maxima' | 'suprema'

export const KADEME_ADI: Record<Kademe, string> = {
  primula: 'Primula',
  elita: 'Elita',
  optima: 'Optima',
  maxima: 'Maxima',
  suprema: 'Suprema',
}

/** Liste fiyatından düşülen oran. Optima'dan sonra sabit — %20 tavandır. */
export const KADEME_INDIRIM: Record<Kademe, number> = {
  primula: 5,
  elita: 10,
  optima: 20,
  maxima: 20,
  suprema: 20,
}

/** Sıra çarpanı: 1., 2., 3., 4., 5. ziyaret — 6. ve sonrası sabit ×6. */
export function siraCarpani(sira: number): number {
  return Math.min(Math.max(sira, 1), 6)
}

/**
 * Eşikler. Tek ziyaretle gelen daha yüksek eşik öder.
 * Maxima/Suprema puanla değil süreyle kazanılır — burada yok.
 */
const ESIK = {
  elita:  { tek: 50_000, coklu:  35_000 },
  optima: { tek: 150_000, coklu: 100_000 },
} as const

/**
 * Optima'dan SONRAKİ ziyaret sayısı. Tutardan bağımsız — amaç bağı pekiştirmek.
 * Optima zaten parayı ödemiş; sonrası sadece gelmek.
 * 3 ziyaret ≈ 1 yıl, 5 ziyaret ≈ 1.5-2 yıl (3 aylık ritimde).
 */
const SONRAKI_ZIYARET = { maxima: 3, suprema: 5 } as const

export interface UyelikOdeme {
  amount: number | string | null
  paid_at: string | null
  /** internal_payment.treatment_id — doluysa işlemin gününe yazılır. */
  treatment_id?: string | null
}

export interface UyelikIslem {
  id: string
  treatment_date: string | null
}

export interface UyelikDurumu {
  kademe: Kademe
  kademeAdi: string
  indirim: number
  puan: number
  ziyaret: number
  tahsilat: number
  sonrakiKademe: Kademe | null
  sonrakiKademeAdi: string | null
  /** Bir üst kademeye kalan — TL. Optima'ya kadar ölçü budur. */
  kalanTl: number
  /** Optima üstünde ölçü ziyaret: Maxima/Suprema'ya kalan ziyaret sayısı. */
  kalanZiyaret: number
}

function gunAnahtari(iso: string | null): string | null {
  if (!iso) return null
  // Hem 'YYYY-MM-DD' hem tam ISO zaman damgası gelebilir.
  return iso.slice(0, 10)
}

/** Ödemeleri ziyaret günlerine toplar, büyükten küçüğe sıralı tutar listesi döner. */
export function ziyaretTutarlari(odemeler: UyelikOdeme[], islemler: UyelikIslem[]): number[] {
  const islemGunu = new Map<string, string | null>()
  for (const t of islemler) islemGunu.set(t.id, gunAnahtari(t.treatment_date))

  const gunler = new Map<string, number>()
  for (const o of odemeler) {
    const tutar = Number(o.amount ?? 0)
    if (!Number.isFinite(tutar) || tutar <= 0) continue
    const gun =
      (o.treatment_id ? islemGunu.get(o.treatment_id) ?? null : null) ??
      gunAnahtari(o.paid_at)
    if (!gun) continue
    gunler.set(gun, (gunler.get(gun) ?? 0) + tutar)
  }

  return Array.from(gunler.values()).sort((a, b) => b - a)
}

export function uyelikHesapla(odemeler: UyelikOdeme[], islemler: UyelikIslem[]): UyelikDurumu {
  const ziyaretler = ziyaretTutarlari(odemeler, islemler)
  const ziyaret = ziyaretler.length
  const tahsilat = ziyaretler.reduce((s, t) => s + t, 0)
  const puan = ziyaretler.reduce((s, t, i) => s + t * siraCarpani(i + 1), 0)

  const tekMi = ziyaret <= 1
  const elitaEsik = tekMi ? ESIK.elita.tek : ESIK.elita.coklu
  const optimaEsik = tekMi ? ESIK.optima.tek : ESIK.optima.coklu

  // Optima'ya KAÇINCI ziyarette ulaşıldı? Sonrası Maxima/Suprema'yı açar.
  let optimaZiyareti = 0
  {
    let birikim = 0
    for (let i = 0; i < ziyaretler.length; i++) {
      birikim += ziyaretler[i] * siraCarpani(i + 1)
      const esik = i === 0 ? ESIK.optima.tek : ESIK.optima.coklu
      if (birikim >= esik) { optimaZiyareti = i + 1; break }
    }
  }
  const optimaSonrasi = optimaZiyareti > 0 ? ziyaret - optimaZiyareti : 0

  const kademe: Kademe =
    optimaZiyareti > 0
      ? (optimaSonrasi >= SONRAKI_ZIYARET.suprema ? 'suprema'
        : optimaSonrasi >= SONRAKI_ZIYARET.maxima ? 'maxima'
        : 'optima')
      : puan >= elitaEsik ? 'elita' : 'primula'

  // Kalan: bir üst eşiğe ulaşmak için BUGÜN gereken ek tahsilat.
  // Bir sonraki ziyaret, sıradaki çarpanla gelir — hastaya o para gösterilir.
  const sonrakiEsik =
    kademe === 'primula' ? elitaEsik : kademe === 'elita' ? optimaEsik : null
  const sonrakiKademe: Kademe | null =
    kademe === 'primula' ? 'elita'
    : kademe === 'elita' ? 'optima'
    : kademe === 'optima' ? 'maxima'
    : kademe === 'maxima' ? 'suprema'
    : null

  // Optima üstünde ölçü para değil ZİYARET.
  const kalanZiyaret =
    kademe === 'optima' ? SONRAKI_ZIYARET.maxima - optimaSonrasi
    : kademe === 'maxima' ? SONRAKI_ZIYARET.suprema - optimaSonrasi
    : 0

  let kalanTl = 0
  if (sonrakiEsik !== null) {
    const eksikPuan = sonrakiEsik - puan
    // Yeni ziyaret eklenince eşik "çoklu"ya düşebilir; en yakın yolu göster.
    const yeniEsik =
      sonrakiKademe === 'elita' ? ESIK.elita.coklu : ESIK.optima.coklu
    const yeniZiyaretCarpan = siraCarpani(ziyaret + 1)
    const yeniZiyaretleEksik = yeniEsik - puan
    const adaylar = [
      eksikPuan > 0 ? eksikPuan / siraCarpani(ziyaret) : 0,          // mevcut ziyarete ekleme
      yeniZiyaretleEksik > 0 ? yeniZiyaretleEksik / yeniZiyaretCarpan : 0, // yeni ziyaret
    ].filter(n => n > 0)
    kalanTl = adaylar.length ? Math.ceil(Math.min(...adaylar)) : 0
  }

  return {
    kademe,
    kademeAdi: KADEME_ADI[kademe],
    indirim: KADEME_INDIRIM[kademe],
    puan,
    ziyaret,
    tahsilat,
    sonrakiKademe,
    sonrakiKademeAdi: sonrakiKademe ? KADEME_ADI[sonrakiKademe] : null,
    kalanTl,
    kalanZiyaret,
  }
}

/** Liste fiyatından kademe fiyatı. */
export function kademeFiyati(listeFiyati: number, kademe: Kademe): number {
  return Math.round(listeFiyati * (1 - KADEME_INDIRIM[kademe] / 100))
}
