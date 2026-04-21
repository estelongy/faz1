/**
 * Rozet (Badge) sistemi
 * Badge'ler panel'de görünür, belirli aksiyonlarda otomatik verilir.
 */

export type BadgeKey =
  | 'ilk_analiz'
  | 'ilk_anket'
  | 'ilk_randevu'
  | 'klinik_onayli'
  | 'premium_skor'
  | 'genc_skor'
  | 'uc_analiz'
  | 'ilk_paylasim'

export const BADGE_META: Record<BadgeKey, { emoji: string; label: string; desc: string; color: string }> = {
  ilk_analiz:    { emoji: '🔬', label: 'İlk Analiz',      desc: 'İlk EGS analizini yaptın',                 color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
  ilk_anket:     { emoji: '📋', label: 'Longevity',        desc: 'Longevity anketini doldurdun',             color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
  ilk_randevu:   { emoji: '🏥', label: 'İlk Randevu',      desc: 'İlk klinik randevunu aldın',               color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
  klinik_onayli: { emoji: '✦',  label: 'Klinik Onaylı',   desc: 'Klinik onaylı EGS skorun var',             color: 'from-[#00d4ff]/20 to-blue-500/20 border-[#00d4ff]/30' },
  premium_skor:  { emoji: '🌟', label: 'Premium',          desc: 'EGS Skorun 90 veya üzerinde!',             color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' },
  genc_skor:     { emoji: '💚', label: 'Genç Görünümlü',   desc: 'EGS Skorun 75 veya üzerinde!',             color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
  uc_analiz:     { emoji: '🔄', label: '3 Analiz',         desc: '3 veya daha fazla analiz yaptın',          color: 'from-fuchsia-500/20 to-violet-500/20 border-fuchsia-500/30' },
  ilk_paylasim:  { emoji: '📣', label: 'Paylaşımcı',       desc: 'Skorunu sosyal medyada paylaştın',         color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
}

export type BadgeMeta = typeof BADGE_META[BadgeKey]
