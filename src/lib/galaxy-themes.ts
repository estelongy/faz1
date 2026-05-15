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

  // ─── BiyoAGE — derin mor dark (ölçüm/analiz) ────────────────────────
  biyoage: {
    name: 'BiyoAGE',
    mode: 'dark',
    bgFrom: 'from-[#1B1330]',
    bgVia: 'via-[#241942]',
    bgTo: 'to-[#120B22]',
    cardBg: 'bg-[#241942]/60',
    cardBorder: 'border-[#3D2C66]',
    inputBg: 'bg-[#120B22]',
    inputBorder: 'border-[#3D2C66]',
    inputFocus: 'focus:border-[#9F8CE0]',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-[#6B5A99]',
    buttonGradient: 'from-[#9F8CE0] to-[#8B76D4]',
    buttonHover: 'hover:from-[#8B76D4] hover:to-[#7A66C8]',
    buttonText: 'text-[#1B1330]',
    iconGradient: 'from-[#9F8CE0] to-[#7E6BC9]',
    iconColor: 'text-white',
    headingText: 'text-white',
    labelText: 'text-[#C9BBF5]/80',
    mutedText: 'text-[#C9BBF5]/70',
    accent: 'text-[#C9BBF5]',
    accentHover: 'hover:text-[#E0D6FA]',
    checkboxBg: 'bg-[#9F8CE0] border-[#9F8CE0]',
    checkboxIdleBorder: 'border-[#3D2C66] group-hover:border-[#9F8CE0]',
    ringPulse: 'bg-[#9F8CE0]',
    dividerBorder: 'border-[#3D2C66]/60',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-500/30',
    errorText: 'text-red-300',
    backLinkText: 'text-[#C9BBF5]/80 hover:text-white',
    backLinkHover: 'hover:bg-white/5',
    strengthText: 'text-[#C9BBF5]/60',
    subline: 'Biyolojik yaşını ölç, yavaşlat.',
  },

  // ─── EsteKlinik — teal dark (klinik/aksiyon) ────────────────────────
  esteklinik: {
    name: 'EsteKlinik',
    mode: 'dark',
    bgFrom: 'from-[#064E3B]',
    bgVia: 'via-[#0A6347]',
    bgTo: 'to-[#053527]',
    cardBg: 'bg-[#0A6347]/40',
    cardBorder: 'border-[#10876B]/40',
    inputBg: 'bg-[#053527]',
    inputBorder: 'border-[#10876B]/40',
    inputFocus: 'focus:border-[#10876B]',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-emerald-300/40',
    buttonGradient: 'from-[#10876B] to-[#0E7559]',
    buttonHover: 'hover:from-[#0E7559] hover:to-[#0A6347]',
    buttonText: 'text-white',
    iconGradient: 'from-[#10876B] to-[#0A6347]',
    iconColor: 'text-white',
    headingText: 'text-white',
    labelText: 'text-emerald-100/80',
    mutedText: 'text-emerald-100/70',
    accent: 'text-emerald-300',
    accentHover: 'hover:text-emerald-200',
    checkboxBg: 'bg-[#10876B] border-[#10876B]',
    checkboxIdleBorder: 'border-[#10876B]/40 group-hover:border-[#10876B]',
    ringPulse: 'bg-[#10876B]',
    dividerBorder: 'border-[#10876B]/30',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-500/30',
    errorText: 'text-red-300',
    backLinkText: 'text-emerald-100/80 hover:text-white',
    backLinkHover: 'hover:bg-white/5',
    strengthText: 'text-emerald-100/60',
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
