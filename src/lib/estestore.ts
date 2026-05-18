/**
 * EsteStore — fiyatlandırma, kategori erişimi, tier validasyonu
 *
 * 3 ana kategori:
 *  - kozmetik       → girişsiz tam görünür, role:user tam, role:clinic/health_pro tier indirimi
 *  - sarf_medikal   → girişsiz "ön izleme" (fiyat gizli), role:user erişemez,
 *                     role:clinic/health_pro tam erişim + tier indirimi
 *  - akademi        → girişsiz "ön izleme" (fiyat gizli), role:user erişemez,
 *                     role:clinic/health_pro tam erişim. Tier YOK; düz fiyat (course_packages tablosu).
 *
 * "Profesyonel" = role:clinic VEYA role:health_professional
 */

export const ESTESTORE_CATEGORIES = [
  { value: 'kozmetik', label: 'Kozmetik', icon: '🧴', sellerLabel: 'Markalar' },
  { value: 'sarf_medikal', label: 'Sarf & Medikal', icon: '💉', sellerLabel: 'Tedarikçiler' },
  { value: 'akademi', label: 'Akademi', icon: '🎓', sellerLabel: 'Estelongy' },
] as const

export type EsteStoreCategory = typeof ESTESTORE_CATEGORIES[number]['value']

export type UserRole = 'user' | 'clinic' | 'health_professional' | 'vendor' | 'admin' | null

export function isProfessional(role: UserRole): boolean {
  return role === 'clinic' || role === 'health_professional' || role === 'admin'
}

/**
 * Erişim matrisi
 * - canSeePrice: fiyat görüntüleme yetkisi
 * - canBuy: satın alma yetkisi
 * - mode: 'full' (tam erişim), 'preview' (ön izleme — fiyat gizli, satın al yok), 'blocked' (hiç görünmez)
 */
export interface CategoryAccess {
  canSeePrice: boolean
  canBuy: boolean
  mode: 'full' | 'preview' | 'blocked'
}

export function getCategoryAccess(
  category: EsteStoreCategory,
  role: UserRole
): CategoryAccess {
  const isPro = isProfessional(role)
  const isLoggedIn = role !== null

  if (category === 'kozmetik') {
    // Herkes görür ve satın alabilir; girişsiz fiyat görür ama satın alma için giriş ister
    return {
      canSeePrice: true,
      canBuy: isLoggedIn,
      mode: 'full',
    }
  }

  // sarf_medikal & akademi — yalnızca profesyoneller
  if (isPro) {
    return { canSeePrice: true, canBuy: true, mode: 'full' }
  }

  // akademi → ön izleme (paket adı + slug listelenir, fiyat gizli)
  if (category === 'akademi') {
    return { canSeePrice: false, canBuy: false, mode: 'preview' }
  }

  // sarf_medikal → role:user için TAMAMEN GİZLİ.
  // Storefront listeleri bu kategoriyi hasta kullanıcıdan filtrelemeli;
  // ürün detay sayfası blocked dönerse 404 verilir.
  return { canSeePrice: false, canBuy: false, mode: 'blocked' }
}

/**
 * Liste sorgularında kullanılacak görünür kategori filtresi.
 * Pro değilse 'sarf_medikal' ürünler tamamen elenir; akademi preview kalır.
 */
export function visibleCategoriesFor(role: UserRole): EsteStoreCategory[] {
  if (isProfessional(role)) return ['kozmetik', 'sarf_medikal', 'akademi']
  return ['kozmetik', 'akademi']
}

// ─── Storefront sections (curated views over flat products) ────────
/**
 * Landing'in linklediği "section" slug'ları gerçek DB kategorisi değil — kürasyon görünümleri.
 * Her bir section, products tablosu üzerinde bir filtre + UI metadatası taşır.
 * DB enum'ları: kozmetik | sarf_medikal | akademi (flat).
 * Yeni bir section eklemek için subcategory tag'leri buraya yaz, satıcı paneli aynı tag'leri kullansın.
 */
export interface SectionDef {
  slug: string
  label: string
  icon: string
  sellerLabel: string
  accent: string
  description: string
  /** products.category filtresi (zorunlu) */
  category: EsteStoreCategory
  /** products.subcategory IN (...) filtresi — boşsa kategoriye giren her şey gelir */
  subcategoryIn?: string[]
  /** Bu section sadece profesyonellere mi açık? */
  proOnly?: boolean
}

export const ESTESTORE_SECTIONS: SectionDef[] = [
  {
    slug: 'kozmetik',
    label: 'Kozmetik',
    icon: '🧴',
    sellerLabel: 'Markalar',
    accent: '#8B7339',
    description: 'Bilim destekli, küratörlü güzellik ürünleri.',
    category: 'kozmetik',
  },
  {
    slug: 'longevity',
    label: 'Longevity — İçten Zamansızlık',
    icon: '⏳',
    sellerLabel: 'Marka Kimliği',
    accent: '#C9A961',
    description: 'NAD+, NMN, resveratrol — bilim destekli yaşlanma karşıtı takviyeler.',
    category: 'kozmetik',
    subcategoryIn: ['longevity', 'nad', 'nmn', 'supplement', 'takviye'],
  },
  {
    slug: 'islem-sonrasi',
    label: 'İşlem Sonrası Bakım',
    icon: '🩹',
    sellerLabel: 'Klinik Köprüsü',
    accent: '#10876B',
    description: 'Dolgu, botoks, lazer sonrası iyileşmeni hızlandıran küratörlü bakım kitleri.',
    category: 'kozmetik',
    subcategoryIn: ['islem-sonrasi', 'post-treatment', 'iyilesme', 'serum'],
  },
  {
    slug: 'biyohacking-olcum',
    label: 'Biyohacking & Ölçüm',
    icon: '📊',
    sellerLabel: 'Diferansiyasyon',
    accent: '#C9A961',
    description: 'Vücudunu ölç, kendini tanı — DNA, mikrobiyom, CGM ve wearable.',
    category: 'kozmetik',
    subcategoryIn: ['biyohacking', 'dna', 'mikrobiyom', 'cgm', 'wearable', 'olcum'],
  },
  {
    slug: 'sarf-medikal',
    label: 'Sarf & Medikal',
    icon: '💉',
    sellerLabel: 'Tedarikçiler',
    accent: '#8B7339',
    description: 'Hekim kullanımına özel sarf, enjektabl ve medikal ürünler.',
    category: 'sarf_medikal',
    proOnly: true,
  },
]

export function getSectionBySlug(slug: string): SectionDef | null {
  return ESTESTORE_SECTIONS.find(s => s.slug === slug) ?? null
}

// ─── Tier pricing ──────────────────────────────────────────────────

export interface PricingTier {
  min: number
  max: number | null
  discount_rate: number // 0.10 = %10
}

export type PricingTiers = PricingTier[]

/**
 * Verilen miktara göre uygulanan tier'ı bulur.
 * Tier yoksa null döner (indirim yok).
 */
export function findTierForQuantity(
  tiers: PricingTiers | null | undefined,
  quantity: number
): PricingTier | null {
  if (!tiers || tiers.length === 0) return null
  for (const t of tiers) {
    const minOk = quantity >= t.min
    const maxOk = t.max === null || quantity <= t.max
    if (minOk && maxOk) return t
  }
  return null
}

/**
 * Profesyonel fiyatı hesaplar (klinik/sağlık prof. için).
 * Tier yoksa baseFiyat döner.
 */
export function calculateProfessionalPrice(
  basePrice: number,
  tiers: PricingTiers | null | undefined,
  quantity: number = 1
): { effectiveRate: number; finalPrice: number; tier: PricingTier | null } {
  const tier = findTierForQuantity(tiers, quantity)
  const rate = tier?.discount_rate ?? 0
  const finalPrice = Math.round(basePrice * (1 - rate) * 100) / 100
  return { effectiveRate: rate, finalPrice, tier }
}

/**
 * Tek bakışta gösterilecek 3 baremlik özet — klinik kartında kullanılır.
 * Tier yoksa boş array döner.
 */
export interface TierSummaryRow {
  rangeLabel: string
  rate: number
  unitPrice: number
}

export function buildTierSummary(
  basePrice: number,
  tiers: PricingTiers | null | undefined
): TierSummaryRow[] {
  if (!tiers || tiers.length === 0) return []
  return tiers.map(t => {
    const rangeLabel =
      t.max === null
        ? `${t.min}+ adet`
        : t.min === t.max
        ? `${t.min} adet`
        : `${t.min}–${t.max} adet`
    const unitPrice = Math.round(basePrice * (1 - t.discount_rate) * 100) / 100
    return { rangeLabel, rate: t.discount_rate, unitPrice }
  })
}

// ─── Validasyon (vendor input) ─────────────────────────────────────

export interface TierValidationError {
  index: number
  message: string
}

/**
 * Vendor'un girdiği pricing_tiers'ı doğrular.
 * - En az 1, en fazla 3 satır
 * - min ≤ max (max=null → sınırsız, sadece son satırda)
 * - Aralıklar artan ve örtüşmüyor olmalı
 * - Oranlar 0–1 arası
 * - Kozmetikte ilk satırın oranı min %10 (admin parametre)
 * - Oranlar artan veya eşit (monoton)
 */
export function validatePricingTiers(
  tiers: PricingTiers,
  category: EsteStoreCategory,
  minProfessionalDiscount: number = 0.1
): TierValidationError[] {
  const errors: TierValidationError[] = []

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return [{ index: -1, message: 'En az 1 barem girilmelidir.' }]
  }
  if (tiers.length > 3) {
    return [{ index: -1, message: 'En fazla 3 barem girebilirsin.' }]
  }

  let prevMax = 0
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]
    const isLast = i === tiers.length - 1

    if (!Number.isFinite(t.min) || t.min < 1) {
      errors.push({ index: i, message: 'min ≥ 1 olmalı' })
    }
    if (t.max !== null && (!Number.isFinite(t.max) || t.max < t.min)) {
      errors.push({ index: i, message: 'max ≥ min olmalı' })
    }
    if (!isLast && t.max === null) {
      errors.push({ index: i, message: 'Sadece son barem max=∞ olabilir' })
    }
    if (t.min !== prevMax + 1 && i > 0) {
      errors.push({
        index: i,
        message: `Önceki baremin bittiği yerden devam etmeli (beklenen min: ${prevMax + 1})`,
      })
    }
    if (!Number.isFinite(t.discount_rate) || t.discount_rate < 0 || t.discount_rate > 0.95) {
      errors.push({ index: i, message: 'İndirim oranı 0 ile 0.95 arasında olmalı' })
    }

    if (i === 0 && category === 'kozmetik' && t.discount_rate < minProfessionalDiscount) {
      errors.push({
        index: i,
        message: `Kozmetik kategorisinde ilk barem en az %${Math.round(minProfessionalDiscount * 100)} olmalı`,
      })
    }
    if (i > 0 && t.discount_rate < tiers[i - 1].discount_rate) {
      errors.push({
        index: i,
        message: 'İndirim oranı bir önceki baremden küçük olamaz',
      })
    }

    prevMax = t.max ?? Number.POSITIVE_INFINITY
  }

  return errors
}

// ─── Yardımcı format ───────────────────────────────────────────────

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(rate: number): string {
  return `%${Math.round(rate * 100)}`
}
