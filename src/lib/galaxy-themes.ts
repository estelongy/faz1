/**
 * Galaksi-aware form temaları — /kayit, /giris, /panel layout ortak kullanır.
 *
 * Niyet: tek sayfa, dört kostüm. ?g=biyoage|esteklinik|estestore yoksa
 * Estelongy çatı (default) düşer. Estelongy başrolde değil — yapımcı.
 *
 * Yıldız metaforu YASAK (memory: galaksi_geciş_dili). DNA helix kullanılır.
 *
 * MOD: dark (BiyoAGE/EsteKlinik/Estelongy) vs light (EsteStore — landing
 * krem/altın/navy paletini aynalar, lüks butik hissi).
 */

export type Galaxy = 'biyoage' | 'esteklinik' | 'estestore' | 'default'
export type ThemeMode = 'dark' | 'light'

export interface GalaxyTheme {
  name: string
  mode: ThemeMode
  // Arka plan
  bgFrom: string
  bgVia: string
  bgTo: string
  // Kart
  cardBg: string
  cardBorder: string
  // Input
  inputBg: string
  inputBorder: string
  inputFocus: string
  inputText: string         // input içeriği rengi
  inputPlaceholder: string  // placeholder rengi
  // Buton
  buttonGradient: string
  buttonHover: string
  buttonText: string
  // İkon kutusu
  iconGradient: string
  iconColor: string         // icon SVG stroke/fill
  // Tipografi
  headingText: string       // H1
  labelText: string         // form label
  mutedText: string         // subline, secondary
  // Aksent
  accent: string            // link text
  accentHover: string
  // Checkbox & misc
  checkboxBg: string
  checkboxIdleBorder: string
  ringPulse: string
  dividerBorder: string
  // Hata kutusu — dark/light farkı küçük ama olsun
  errorBg: string
  errorBorder: string
  errorText: string
  // Geri-anasayfa pill
  backLinkText: string
  backLinkHover: string
  // Şifre gücü etiketi
  strengthText: string
  // Sub-line
  subline: string
}

export const GALAXY_THEMES: Record<Galaxy, GalaxyTheme> = {
  // ─── Estelongy çatı — mor dark ──────────────────────────────────────
  default: {
    name: 'Estelongy',
    mode: 'dark',
    bgFrom: 'from-slate-900',
    bgVia: 'via-slate-900',
    bgTo: 'to-slate-800',
    cardBg: 'bg-slate-800/50',
    cardBorder: 'border-slate-700',
    inputBg: 'bg-slate-900',
    inputBorder: 'border-slate-700',
    inputFocus: 'focus:border-violet-500',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-slate-500',
    buttonGradient: 'from-violet-600 to-purple-600',
    buttonHover: 'hover:from-violet-500 hover:to-purple-500',
    buttonText: 'text-white',
    iconGradient: 'from-violet-500 to-purple-600',
    iconColor: 'text-white',
    headingText: 'text-white',
    labelText: 'text-slate-400',
    mutedText: 'text-slate-400',
    accent: 'text-violet-400',
    accentHover: 'hover:text-violet-300',
    checkboxBg: 'bg-violet-600 border-violet-600',
    checkboxIdleBorder: 'border-slate-600 group-hover:border-slate-500',
    ringPulse: 'bg-violet-500',
    dividerBorder: 'border-slate-700/60',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-500/30',
    errorText: 'text-red-400',
    backLinkText: 'text-slate-300 hover:text-white',
    backLinkHover: 'hover:bg-white/5',
    strengthText: 'text-slate-500',
    subline: 'Üç dünyaya tek anahtar.',
  },

  // ─── BiyoAGE — beyaz LIGHT + derin mor aksent (ölçüm/analiz) ────────
  // Diğer iki galaksiyle (EsteKlinik/EsteStore) tutarlı: light bg + tema aksenti.
  biyoage: {
    name: 'BiyoAGE',
    mode: 'light',
    bgFrom: 'from-white',
    bgVia: 'via-[#F5F3FF]',          // çok hafif lavanta tint
    bgTo: 'to-white',
    cardBg: 'bg-white',
    cardBorder: 'border-[#E9E5FF]',
    inputBg: 'bg-[#FAF9FF]',         // off-white lavanta
    inputBorder: 'border-[#E9E5FF]',
    inputFocus: 'focus:border-[#7C3AED]',
    inputText: 'text-slate-900',
    inputPlaceholder: 'placeholder-slate-400',
    buttonGradient: 'from-[#6D28D9] to-[#7C3AED]',   // derin mor solid
    buttonHover: 'hover:from-[#5B21B6] hover:to-[#6D28D9]',
    buttonText: 'text-white',
    iconGradient: 'from-[#6D28D9] to-[#7C3AED]',
    iconColor: 'text-white',
    headingText: 'text-slate-900',
    labelText: 'text-slate-600',
    mutedText: 'text-slate-500',
    accent: 'text-[#6D28D9]',
    accentHover: 'hover:text-[#5B21B6]',
    checkboxBg: 'bg-[#7C3AED] border-[#7C3AED]',
    checkboxIdleBorder: 'border-slate-300 group-hover:border-[#7C3AED]',
    ringPulse: 'bg-[#7C3AED]',
    dividerBorder: 'border-slate-200',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-200',
    errorText: 'text-red-700',
    backLinkText: 'text-slate-600 hover:text-slate-900',
    backLinkHover: 'hover:bg-[#F5F3FF]',
    strengthText: 'text-slate-500',
    subline: 'Biyolojik yaşını ölç, yavaşlat.',
  },

  // ─── EsteKlinik — beyaz/steril LIGHT, yeşil aksent (klinik) ─────────
  // Klinik = beyaz alan, hijyen estetiği. Yeşil sadece aksan.
  esteklinik: {
    name: 'EsteKlinik',
    mode: 'light',
    bgFrom: 'from-white',
    bgVia: 'via-[#F0FDF4]',     // çok hafif yeşil tint
    bgTo: 'to-white',
    cardBg: 'bg-white',
    cardBorder: 'border-[#D1FAE5]',
    inputBg: 'bg-[#F8FAF9]',    // off-white, klinik
    inputBorder: 'border-[#D1FAE5]',
    inputFocus: 'focus:border-[#10876B]',
    inputText: 'text-slate-900',
    inputPlaceholder: 'placeholder-slate-400',
    buttonGradient: 'from-[#10876B] to-[#0E7559]',
    buttonHover: 'hover:from-[#0E7559] hover:to-[#064E3B]',
    buttonText: 'text-white',
    iconGradient: 'from-[#10876B] to-[#0E7559]',
    iconColor: 'text-white',
    headingText: 'text-slate-900',
    labelText: 'text-slate-600',
    mutedText: 'text-slate-500',
    accent: 'text-[#047857]',    // koyu emerald
    accentHover: 'hover:text-[#065F46]',
    checkboxBg: 'bg-[#10876B] border-[#10876B]',
    checkboxIdleBorder: 'border-slate-300 group-hover:border-[#10876B]',
    ringPulse: 'bg-[#10876B]',
    dividerBorder: 'border-slate-200',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-200',
    errorText: 'text-red-700',
    backLinkText: 'text-slate-600 hover:text-slate-900',
    backLinkHover: 'hover:bg-[#F0FDF4]',
    strengthText: 'text-slate-500',
    subline: 'Onaylı klinik ekosistemine katıl.',
  },

  // ─── EsteStore — krem/altın/navy LIGHT (lüks butik) ─────────────────
  // Landing'i aynalar: bg #FAFAF7 + accent #C9A961 + dark #0F172A
  estestore: {
    name: 'EsteStore',
    mode: 'light',
    bgFrom: 'from-[#FAFAF7]',
    bgVia: 'via-[#F5EFE3]',
    bgTo: 'to-[#FAFAF7]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#E5DECB]',
    inputBg: 'bg-[#FAFAF7]',
    inputBorder: 'border-[#E5DECB]',
    inputFocus: 'focus:border-[#C9A961]',
    inputText: 'text-slate-900',
    inputPlaceholder: 'placeholder-slate-400',
    buttonGradient: 'from-[#0F172A] to-[#1E293B]',  // navy lux
    buttonHover: 'hover:from-[#1E293B] hover:to-[#0F172A]',
    buttonText: 'text-[#C9A961]',                   // altın text on navy
    iconGradient: 'from-[#0F172A] to-[#1E293B]',    // navy kutu
    iconColor: 'text-[#C9A961]',                    // altın helix
    headingText: 'text-slate-900',
    labelText: 'text-slate-600',
    mutedText: 'text-slate-500',
    accent: 'text-[#8B7339]',                       // koyu altın link
    accentHover: 'hover:text-[#6B5828]',
    checkboxBg: 'bg-[#C9A961] border-[#C9A961]',
    checkboxIdleBorder: 'border-slate-300 group-hover:border-[#C9A961]',
    ringPulse: 'bg-[#C9A961]',
    dividerBorder: 'border-slate-200',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-200',
    errorText: 'text-red-700',
    backLinkText: 'text-slate-600 hover:text-slate-900',
    backLinkHover: 'hover:bg-white',
    strengthText: 'text-slate-500',
    subline: 'Hekim puanlı ürünleri keşfet.',
  },
}

/** ?g= param'ından güvenli galaksi çözer (whitelist) */
export function resolveGalaxy(param: string | null | undefined): Galaxy {
  if (param && param in GALAXY_THEMES) return param as Galaxy
  return 'default'
}
