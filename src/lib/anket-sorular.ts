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
}

// ─── Hasta Anketi (5 soru) ──────────────────────────────────────────────────
// Her soru 0–20 arası. Toplam 0–100.

export const HASTA_ANKET_SORULARI: AnketSoru[] = [
  {
    key: 'uyku',
    label: 'Uyku kalitesi',
    desc: 'Son 1 ayda uyku süreniz ve kalitesini değerlendirin',
    emoji: '😴',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Çok kötü', high: 'Mükemmel',
  },
  {
    key: 'beslenme',
    label: 'Beslenme düzeni',
    desc: 'Günlük beslenme alışkanlıklarınız (sebze, meyve, işlenmiş gıda dengesi)',
    emoji: '🥗',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Çok kötü', high: 'Mükemmel',
  },
  {
    key: 'stres',
    label: 'Stres yönetimi',
    desc: 'Son 1 ayda stres seviyeniz ve başa çıkma yetkiniz',
    emoji: '🧘',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Sürekli stresli', high: 'Tamamen rahat',
  },
  {
    key: 'aktivite',
    label: 'Fiziksel aktivite',
    desc: 'Haftalık egzersiz ve günlük hareket miktarınız',
    emoji: '🏃',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Hareketsiz', high: 'Çok aktif',
  },
  {
    key: 'cilt',
    label: 'Cilt koruma rutini',
    desc: 'Günlük cilt bakımı, güneş koruması ve nemlendirme düzeniniz',
    emoji: '✨',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Hiç yok', high: 'Günlük ve düzenli',
  },
]

// ─── Klinik Ek Anketi (5 soru) ──────────────────────────────────────────────
// Yüz yüze seansta sorulur, daha objektif/klinik odaklı sorular.
// Her soru 0–20 arası. Toplam 0–100 (hasta anketiyle aynı ölçekte).

export const KLINIK_EK_SORULARI: AnketSoru[] = [
  {
    key: 'sigara',
    label: 'Sigara kullanımı',
    desc: 'Sigara içiyor musunuz? (0 = hiç, 20 = hiç içmedim)',
    emoji: '🚭',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Yoğun kullanıcı', high: 'Hiç içmedim',
  },
  {
    key: 'alkol',
    label: 'Alkol tüketimi',
    desc: 'Haftalık alkol alımınız (0 = sık, 20 = hiç)',
    emoji: '🍷',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Çok sık', high: 'Hiç',
  },
  {
    key: 'aile_gecmisi',
    label: 'Ailevi sağlık',
    desc: 'Ailede erken yaşlanma / kronik hastalık geçmişi',
    emoji: '👨‍👩‍👧',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Yoğun öykü', high: 'Temiz geçmiş',
  },
  {
    key: 'kronik_hastalik',
    label: 'Mevcut sağlık durumu',
    desc: 'Kronik hastalık var mı? (diyabet, hipertansiyon vb.)',
    emoji: '🏥',
    tip: 'scale',
    min: 0, max: 20,
    low: 'Çoklu tanı', high: 'Sağlıklı',
  },
  {
    key: 'gunes_maruziyeti',
    label: 'Güneş maruziyeti',
    desc: 'Günlük güneş maruziyeti ve koruma önlemi',
    emoji: '☀️',
    tip: 'scale',
    min: 0, max: 20,
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
 * Hasta anketi puanı: max +10 puan katkı.
 * Input: cevap sözlüğü (key → 0..20)
 * Output: 0..10 arası puan
 */
export function hastaAnketPuani(cevaplar: Record<string, number>): number {
  const total = HASTA_ANKET_SORULARI.reduce((sum, s) => {
    const v = cevaplar[s.key]
    return sum + (typeof v === 'number' ? v : 0)
  }, 0)
  // 0..100 → 0..10
  return Math.max(0, Math.min(10, total / 10))
}

/**
 * Klinik anketi puanı: max +20 puan katkı (10 soru, her biri 0..20).
 * Input: cevap sözlüğü (key → 0..20)
 * Output: 0..20 arası puan
 */
export function klinikAnketPuani(cevaplar: Record<string, number>): number {
  const total = KLINIK_ANKET_SORULARI.reduce((sum, s) => {
    const v = cevaplar[s.key]
    return sum + (typeof v === 'number' ? v : 0)
  }, 0)
  // 0..200 → 0..20
  return Math.max(0, Math.min(20, total / 10))
}
