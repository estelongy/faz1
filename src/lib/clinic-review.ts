/**
 * Klinik Deneyim / Yorum Sistemi — Faz 1
 *
 * Felsefe: Yorum platformu değil, ölçüm platformu. Hekim sanatı
 * puanlanmaz, sonucu sistem ölçer (skor Δ). 4 objektif boyut + NPS +
 * tacir filtresi.
 *
 * EGP formülü (Klinik):
 *   EGP = Sonuç Etkinliği × 0.35   ← skor Δ (objektif)
 *       + NPS × 0.25
 *       + Operasyonel (4 ★ ort) × 0.20
 *       + Estelongy Onayı × 0.15
 *       + Profesyonellik × 0.05
 *     × confidence_factor (Bayesian smoothing <5 yorum)
 *     × son 6 ay zaman ağırlığı
 *
 * Bu lib hem form için tip tanımları, hem cron için EGP hesabı sağlar.
 */

// ───────────────────────────────────────────────────────────────────
// Tipler
// ───────────────────────────────────────────────────────────────────

export type TekrarGelir = 'yes' | 'maybe' | 'no'

export interface ClinicReviewInput {
  appointmentId: string
  hijyen: number       // 1-5
  personel: number     // 1-5
  randevuUyumu: number // 1-5
  iletisim: number     // 1-5
  nps: number          // 0-3
  gereksizIslem: boolean
  tekrarGelir: TekrarGelir
  /** PUBLIC yorum — klinik sayfasında görünür */
  pozitifMetin?: string | null
  /** PRIVATE mesaj — sadece klinik panelinde görünür (Dilek/Şikayet/Teşekkür) */
  iyilestirmeMetni?: string | null
  /** Public yorumda isim gizli mi? Default true. */
  isAnonymous: boolean
}

export interface ClinicReviewRow {
  id: string
  appointment_id: string
  clinic_id: string
  user_id: string
  hijyen: number
  personel: number
  randevu_uyumu: number
  iletisim: number
  nps: number
  gereksiz_islem: boolean
  tekrar_gelir: TekrarGelir
  pozitif_metin: string | null
  iyilestirme_metni: string | null
  is_anonymous: boolean
  edit_window_until: string
  clinic_response: string | null
  clinic_responded_at: string | null
  private_wants_reply: boolean
  private_clinic_response: string | null
  private_responded_at: string | null
  private_read_at: string | null
  created_at: string
  updated_at: string
}

// ───────────────────────────────────────────────────────────────────
// Validasyon
// ───────────────────────────────────────────────────────────────────

export function validateReviewInput(input: Partial<ClinicReviewInput>): { ok: true; value: ClinicReviewInput } | { ok: false; error: string } {
  if (!input.appointmentId || typeof input.appointmentId !== 'string') {
    return { ok: false, error: 'Randevu ID eksik' }
  }
  const star = (k: keyof ClinicReviewInput) => {
    const v = input[k]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) return null
    return v
  }
  const hijyen = star('hijyen')
  const personel = star('personel')
  const randevuUyumu = star('randevuUyumu')
  const iletisim = star('iletisim')
  if (hijyen == null) return { ok: false, error: 'Hijyen 1-5 arası seçilmeli' }
  if (personel == null) return { ok: false, error: 'Personel 1-5 arası seçilmeli' }
  if (randevuUyumu == null) return { ok: false, error: 'Randevu uyumu 1-5 arası seçilmeli' }
  if (iletisim == null) return { ok: false, error: 'İletişim 1-5 arası seçilmeli' }

  const nps = input.nps
  if (typeof nps !== 'number' || !Number.isInteger(nps) || nps < 0 || nps > 3) {
    return { ok: false, error: 'NPS 0-4 arası seçilmeli' }
  }
  if (typeof input.gereksizIslem !== 'boolean') {
    return { ok: false, error: 'Gereksiz işlem alanı eksik' }
  }
  if (input.tekrarGelir !== 'yes' && input.tekrarGelir !== 'maybe' && input.tekrarGelir !== 'no') {
    return { ok: false, error: 'Tekrar gelir alanı geçersiz' }
  }
  if (typeof input.isAnonymous !== 'boolean') {
    return { ok: false, error: 'Anonim alanı eksik' }
  }
  const pozitif = (input.pozitifMetin ?? '').toString().trim().slice(0, 1000)
  const iyilestirme = (input.iyilestirmeMetni ?? '').toString().trim().slice(0, 1000)
  return {
    ok: true,
    value: {
      appointmentId: input.appointmentId,
      hijyen,
      personel,
      randevuUyumu,
      iletisim,
      nps,
      gereksizIslem: input.gereksizIslem,
      tekrarGelir: input.tekrarGelir,
      pozitifMetin: pozitif || null,
      iyilestirmeMetni: iyilestirme || null,
      isAnonymous: input.isAnonymous,
    },
  }
}

// ───────────────────────────────────────────────────────────────────
// EGP Hesabı (Faz 1)
// ───────────────────────────────────────────────────────────────────

/**
 * Operasyonel skor: 4 ★ ortalaması × 2 → 0-10 ölçeği.
 * Tüm yorumların ortalaması.
 */
export function operationalScoreFromReviews(reviews: ClinicReviewRow[]): number | null {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((acc, r) => {
    const avg4 = (r.hijyen + r.personel + r.randevu_uyumu + r.iletisim) / 4
    return acc + avg4
  }, 0)
  const avg = sum / reviews.length
  return Math.round((avg * 2) * 100) / 100 // 1-5 → 2-10
}

/**
 * NPS skoru: 0-3 → 0-10 ölçeği.
 */
export function npsScoreFromReviews(reviews: ClinicReviewRow[]): number | null {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((acc, r) => acc + r.nps, 0)
  const avg = sum / reviews.length
  return Math.round((avg * (10 / 3)) * 100) / 100 // 0-3 → 0-10
}

/**
 * Sonuç etkinliği: skor Δ (final - initial) ortalaması.
 * Bu cron tarafından appointment + score join ile hesaplanır.
 * delta 0-30 arası bekleniyor, 0-10 ölçeğine normalize: min(delta/3, 10)
 */
export function resultEffectivenessScore(avgDelta: number | null): number | null {
  if (avgDelta == null) return null
  return Math.min(Math.max(avgDelta / 3, 0), 10)
}

/**
 * Estelongy Onayı: akreditasyon faz'ına göre.
 * Faz 0 → 0, Faz 1 → 4, Faz 2 → 7, Faz 3 → 10
 */
export function accreditationScore(phase: number): number {
  switch (phase) {
    case 0: return 0
    case 1: return 4
    case 2: return 7
    case 3: return 10
    default: return 0
  }
}

/**
 * Profesyonellik: completed randevu / toplam randevu oranı.
 * 0-1 → 0-10
 */
export function professionalismScore(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return Math.min((completedCount / totalCount) * 10, 10)
}

/**
 * Bayesian shrinkage: <5 yorum varsa global ortalamaya çek.
 * confidence_factor: review_count / (review_count + 5)
 */
export function confidenceFactor(reviewCount: number): number {
  return reviewCount / (reviewCount + 5)
}

/**
 * Klinik EGP hesabı.
 * Ağırlıklar:
 *   Sonuç 0.35 + NPS 0.25 + Operasyonel 0.20 + Estelongy 0.15 + Profesyonel 0.05
 */
export function computeClinicEGP(args: {
  resultEff: number | null
  nps: number | null
  operational: number | null
  accreditation: number
  professionalism: number
  reviewCount: number
  globalAvg: number
}): number {
  const cf = confidenceFactor(args.reviewCount)

  // Eksik metrikler global ortalamaya doldurulur
  const r = args.resultEff ?? args.globalAvg
  const n = args.nps ?? args.globalAvg
  const o = args.operational ?? args.globalAvg

  const raw =
    r * 0.35 +
    n * 0.25 +
    o * 0.20 +
    args.accreditation * 0.15 +
    args.professionalism * 0.05

  // Bayesian shrinkage: az yorum varsa global ortalamaya yaklaş
  const shrunk = raw * cf + args.globalAvg * (1 - cf)

  return Math.round(shrunk * 100) / 100
}

// ───────────────────────────────────────────────────────────────────
// UI yardımcıları
// ───────────────────────────────────────────────────────────────────

export const NPS_LABELS = [
  'Tavsiye Etmem',
  'Kararsızım',
  'Öneririm',
  'Kesinlikle Öneririm',
] as const

export const TEKRAR_GELIR_LABELS: Record<TekrarGelir, string> = {
  yes: 'Evet, yine gelirim',
  maybe: 'Belki',
  no: 'Hayır',
}

export const STAR_DIMENSIONS = [
  { key: 'hijyen' as const, label: 'Hijyen', icon: '🧴' },
  { key: 'personel' as const, label: 'Personel', icon: '👥' },
  { key: 'randevuUyumu' as const, label: 'Randevu Uyumu', icon: '⏰' },
  { key: 'iletisim' as const, label: 'İletişim', icon: '💬' },
] as const

export function egpBadgeColor(egp: number | null): string {
  if (egp == null) return 'bg-slate-700/30 border-slate-600 text-slate-400'
  if (egp < 5) return 'bg-red-500/10 border-red-500/30 text-red-400'
  if (egp < 6.5) return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  if (egp < 8) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
  return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
}

export function egpLabel(egp: number | null): string {
  if (egp == null) return 'Henüz Ölçülmedi'
  if (egp < 5) return 'Gelişiyor'
  if (egp < 6.5) return 'Standart'
  if (egp < 8) return 'İyi'
  return 'Üstün'
}
