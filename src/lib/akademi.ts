/**
 * Akademi MVP — tipler ve yardımcı fonksiyonlar
 */

export type CoursePackageLevel = 'beginner' | 'intermediate' | 'advanced'
export type StreamStatus = 'pending' | 'processing' | 'ready' | 'error'
export type PurchaseStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface CoursePackage {
  id: string
  clinic_id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  price: number
  currency: string
  category: string | null
  level: CoursePackageLevel
  is_published: boolean
  total_videos: number
  total_duration_seconds: number
  total_purchases: number
  total_reviews: number
  avg_rating: number | null
  completion_rate: number | null
  refund_rate: number | null
  quality_score: number | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface CourseVideo {
  id: string
  package_id: string
  title: string
  description: string | null
  stream_uid: string | null
  stream_status: StreamStatus
  duration_seconds: number
  sort_order: number
  is_preview: boolean
  created_at: string
  updated_at: string
}

export interface CoursePurchase {
  id: string
  user_id: string
  package_id: string
  amount: number
  currency: string
  educator_share: number | null
  platform_share: number | null
  stripe_payment_intent_id: string | null
  stripe_session_id: string | null
  status: PurchaseStatus
  refunded_at: string | null
  refund_reason: string | null
  educator_payout_at: string | null
  educator_payout_reference: string | null
  created_at: string
  paid_at: string | null
}

export interface CourseProgress {
  id: string
  user_id: string
  package_id: string
  video_id: string
  watched_seconds: number
  completed: boolean
  last_watched_at: string
}

export interface CourseReview {
  id: string
  user_id: string
  package_id: string
  purchase_id: string
  rating: number
  comment: string | null
  is_hidden: boolean
  created_at: string
  updated_at: string
}

// =============================================
// Komisyon
// =============================================

export const PLATFORM_COMMISSION_RATE = 0.30 // %30 Estelongy
export const EDUCATOR_SHARE_RATE = 0.70      // %70 hoca

export function splitCommission(amount: number): {
  educator_share: number
  platform_share: number
} {
  const platform = Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100
  const educator = Math.round((amount - platform) * 100) / 100
  return { educator_share: educator, platform_share: platform }
}

// =============================================
// Kategori
// =============================================

export const AKADEMI_KATEGORILER = [
  { value: 'filler',           label: 'Dolgu (Filler)' },
  { value: 'botoks',           label: 'Botulinum Toksin' },
  { value: 'biyostimulator',   label: 'Biyostimülatörler' },
  { value: 'iplik',            label: 'İp Askı / İplik' },
  { value: 'lazer',            label: 'Lazer & Işık' },
  { value: 'mezoterapi',       label: 'Mezoterapi & PRP' },
  { value: 'kimyasal_peeling', label: 'Kimyasal Peeling' },
  { value: 'rezurfasyon',      label: 'Cilt Rezurfasyonu' },
  { value: 'saglikli_cilt',    label: 'Sağlıklı Cilt & Bakım' },
  { value: 'isletme',          label: 'Klinik İşletme' },
  { value: 'diger',            label: 'Diğer' },
] as const

export const LEVEL_LABELS: Record<CoursePackageLevel, string> = {
  beginner:     'Temel',
  intermediate: 'Orta',
  advanced:     'İleri',
}

// =============================================
// Slug üretimi
// =============================================

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// =============================================
// Süre format
// =============================================

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0 dk'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} sa ${m} dk`
  return `${m} dk`
}

export function formatPrice(amount: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
