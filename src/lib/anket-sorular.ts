/**
 * Anket soruları — tek kaynak.
 *
 * Hasta anketi (5 soru): randevu sonrası evden doldurulur, opsiyonel.
 * Klinik anketi (10 soru): aynı 5 hasta sorusu yüz yüze tekrar sorulur + 5 ek klinik sorusu.
 *
 * Skor mantığı (CLAUDE.md):
 * - Hasta anketi dolmuşsa ve klinik anketinde aynı 5 soru yeniden cevaplanırsa,
 *   hasta anketi puanı skordan düşülür, klinik anketinin toplam puanı eklenir.
 * - Hasta anketi boşsa klinik anketi direkt eklenir.
 * - Ek 5 klinik sorusu her zaman ek olarak eklenir.
 */

export type AnketSoruTipi = 'scale' | 'boolean'

export interface AnketSoru {
  key: string
  label: string
  desc: string
  emoji: string
  tip: AnketSoruTipi
  /** 'scale' için minimum değer (dahil) */
  min?: number
  /** 'scale' için maksimum değer (dahil) */
  max?: number
  /** Düşük değer etiketi (scale için) */
  low?: string
  /** Yüksek değer etiketi (scale için) */
  high?: string
  /** true ise: yüksek değer = kötü (örn. stres, sigara) */
  ters?: boolean
  /** Cevap max'a (100) eşitse skora eklenecek puan. Ağırlıklı katkı için. */
  maxKatki?: number
}

// ─── Hasta Anketi (5 soru) ──────────────────────────────────────────────────
// Her soru 0–20 arası. Toplam 0–100.

// Sıra: beslenme → cilt → uyku → stres → aktivite (kullanıcı kararı)
// maxKatki: cevap 100/100 olduğunda skora eklenecek puan
export const HASTA_ANKET_SORULARI: AnketSoru[] = [
  {
    key: 'beslenme',
    label: 'Beslenme düzeni',
    desc: '20 yaşınızdan bu yana beslenme düzeninizi, sebze-meyve tüketiminizi ve işlenmiş gıdadan kaçınma alışkanlığınızı 0-100 arasında puanlayın.',
    emoji: '🥗',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Çok kötü', high: 'Mükemmel',
    maxKatki: 0.9,
  },
  {
    key: 'cilt',
    label: 'Cilt koruma rutini',
    desc: '20 yaşınızdan bu yana güneş koruması, nemlendirme ve cilt bakım rutininizi 0-100 arasında puanlayın.',
    emoji: '✨',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Hiç yok', high: 'Günlük ve düzenli',
    maxKatki: 1.0,
  },
  {
    key: 'uyku',
    label: 'Uyku kalitesi',
    desc: '20 yaşınızdan bu yana uyku sürenizi, uyku kalitenizi ve dinlendirme kapasitesini 0-100 arasında puanlayın.',
    emoji: '😴',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Çok kötü', high: 'Mükemmel',
    maxKatki: 0.7,
  },
  {
    key: 'stres',
    label: 'Stres yönetimi',
    desc: '20 yaşınızdan bu yana hayatın stres faktörlerine karşı psikolojik dayanıklılığınızı ve iç huzurunuzu koruma kapasitenizi 0-100 arasında puanlayın.',
    emoji: '🧘',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Sürekli stresli', high: 'Tamamen rahat',
    maxKatki: 0.5,
  },
  {
    key: 'aktivite',
    label: 'Fiziksel aktivite',
    desc: '20 yaşınızdan bu yana kas kütlenizi korumak ve metabolizmanızı canlı tutmak için sergilediğiniz fiziksel aktivite düzeyini 0-100 arasında puanlayın.',
    emoji: '🏃',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Hareketsiz', high: 'Çok aktif',
    maxKatki: 0.5,
  },
]

/** Hasta anketi max toplam katkı = sum(maxKatki) — şu an 3.6 */
export const HASTA_ANKET_MAX_TOPLAM = HASTA_ANKET_SORULARI.reduce(
  (s, q) => s + (q.maxKatki ?? 0), 0
)

// ─── Klinik Ek Anketi (5 soru) ──────────────────────────────────────────────
// Yüz yüze seansta sorulur, daha objektif/klinik odaklı sorular.
// Her soru 0–20 arası. Toplam 0–100 (hasta anketiyle aynı ölçekte).

export const KLINIK_EK_SORULARI: AnketSoru[] = [
  {
    key: 'sigara',
    label: 'Sigara kullanımı',
    desc: 'Sigara kullanım geçmişinizi 0-100 arasında puanlayın (0 = yoğun kullanıcı, 100 = hiç içmedim)',
    emoji: '🚭',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Yoğun kullanıcı', high: 'Hiç içmedim',
  },
  {
    key: 'alkol',
    label: 'Alkol tüketimi',
    desc: 'Alkol tüketim alışkanlığınızı 0-100 arasında puanlayın (0 = çok sık, 100 = hiç)',
    emoji: '🍷',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Çok sık', high: 'Hiç',
  },
  {
    key: 'aile_gecmisi',
    label: 'Ailevi sağlık',
    desc: 'Ailenizdeki erken yaşlanma / kronik hastalık öyküsünü 0-100 arasında puanlayın (0 = yoğun öykü, 100 = temiz geçmiş)',
    emoji: '👨‍👩‍👧',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Yoğun öykü', high: 'Temiz geçmiş',
  },
  {
    key: 'kronik_hastalik',
    label: 'Mevcut sağlık durumu',
    desc: 'Mevcut kronik hastalık durumunuzu 0-100 arasında puanlayın (0 = çoklu tanı, 100 = sağlıklı)',
    emoji: '🏥',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Çoklu tanı', high: 'Sağlıklı',
  },
  {
    key: 'gunes_maruziyeti',
    label: 'Güneş maruziyeti',
    desc: 'Güneş koruma alışkanlığınızı 0-100 arasında puanlayın (0 = korunmasız yoğun maruziyet, 100 = düzenli korunma)',
    emoji: '☀️',
    tip: 'scale',
    min: 0, max: 100,
    low: 'Korunmasız yoğun', high: 'Düzenli korunma',
  },
]

// ─── Klinik Anketi Tam Listesi (10 soru) ────────────────────────────────────
// Hasta anketinin aynı 5 sorusu + ek 5 klinik sorusu.
// UI'da iki bölüm halinde gösterilmeli: "Hasta Anketini Doğrula" + "Ek Klinik Soruları".

export const KLINIK_ANKET_SORULARI: AnketSoru[] = [
  ...HASTA_ANKET_SORULARI,
  ...KLINIK_EK_SORULARI,
]

// ─── Skor Katkı Kuralları ───────────────────────────────────────────────────

/**
 * Hasta anketi puanı: ağırlıklı katkı.
 * Her soru kendi maxKatki'si ile çarpılır: katki = (cevap/100) × maxKatki
 * Input: cevap sözlüğü (key → 0..100)
 * Output: 0..HASTA_ANKET_MAX_TOPLAM arası puan (şu an 0..3.6)
 *
 * Ağırlıklar (sıra: beslenme→cilt→uyku→stres→aktivite):
 *   0.9 + 1.0 + 0.7 + 0.5 + 0.5 = 3.6 max
 */
export function hastaAnketPuani(cevaplar: Record<string, number>): number {
  let total = 0
  for (const s of HASTA_ANKET_SORULARI) {
    const v = cevaplar[s.key]
    if (typeof v !== 'number' || s.maxKatki == null) continue
    total += (v / 100) * s.maxKatki
  }
  return Math.max(0, Math.min(HASTA_ANKET_MAX_TOPLAM, total))
}

/**
 * Klinik anketi puanı: max +20 puan katkı (10 soru, her biri 0..100).
 * Input: cevap sözlüğü (key → 0..100)
 * Output: 0..20 arası puan
 *
 * NOT: Soru başına ağırlık şu an eşit. Sonra tek tek belirlenecek.
 */
export function klinikAnketPuani(cevaplar: Record<string, number>): number {
  const total = KLINIK_ANKET_SORULARI.reduce((sum, s) => {
    const v = cevaplar[s.key]
    return sum + (typeof v === 'number' ? v : 0)
  }, 0)
  // 10 soru × 100 = max 1000 → 0..20
  return Math.max(0, Math.min(20, total / 50))
}
