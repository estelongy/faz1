/**
 * Galaksi-aware form temaları — /kayit ve /giris ortak kullanır.
 *
 * Niyet: tek sayfa, dört kostüm. ?g=biyoage|esteklinik|estestore yoksa
 * Estelongy çatı (default) düşer. Estelongy başrolde değil — yapımcı.
 *
 * Yıldız metaforu YASAK (memory: galaksi_geciş_dili). DNA helix kullanılır.
 */

export type Galaxy = 'biyoage' | 'esteklinik' | 'estestore' | 'default'

export interface GalaxyTheme {
  name: string
  bgFrom: string
  bgVia: string
  bgTo: string
  cardBg: string
  cardBorder: string
  inputBg: string
  inputBorder: string
  inputFocus: string
  buttonGradient: string
  buttonHover: string
  iconGradient: string
  accent: string
  accentHover: string
  checkboxBg: string
  ringPulse: string
  subline: string
}

export const GALAXY_THEMES: Record<Galaxy, GalaxyTheme> = {
  // Estelongy çatı — mor (mevcut)
  default: {
    name: 'Estelongy',
    bgFrom: 'from-slate-900',
    bgVia: 'via-slate-900',
    bgTo: 'to-slate-800',
    cardBg: 'bg-slate-800/50',
    cardBorder: 'border-slate-700',
    inputBg: 'bg-slate-900',
    inputBorder: 'border-slate-700',
    inputFocus: 'focus:border-violet-500',
    buttonGradient: 'from-violet-600 to-purple-600',
    buttonHover: 'hover:from-violet-500 hover:to-purple-500',
    iconGradient: 'from-violet-500 to-purple-600',
    accent: 'text-violet-400',
    accentHover: 'hover:text-violet-300',
    checkboxBg: 'bg-violet-600 border-violet-600',
    ringPulse: 'bg-violet-500',
    subline: 'Üç dünyaya tek anahtar.',
  },
  // BiyoAGE — derin mor (ölçüm/analiz)
  biyoage: {
    name: 'BiyoAGE',
    bgFrom: 'from-[#1B1330]',
    bgVia: 'via-[#241942]',
    bgTo: 'to-[#120B22]',
    cardBg: 'bg-[#241942]/60',
    cardBorder: 'border-[#3D2C66]',
    inputBg: 'bg-[#120B22]',
    inputBorder: 'border-[#3D2C66]',
    inputFocus: 'focus:border-[#9F8CE0]',
    buttonGradient: 'from-[#9F8CE0] to-[#8B76D4]',
    buttonHover: 'hover:from-[#8B76D4] hover:to-[#7A66C8]',
    iconGradient: 'from-[#9F8CE0] to-[#7E6BC9]',
    accent: 'text-[#C9BBF5]',
    accentHover: 'hover:text-[#E0D6FA]',
    checkboxBg: 'bg-[#9F8CE0] border-[#9F8CE0]',
    ringPulse: 'bg-[#9F8CE0]',
    subline: 'Biyolojik yaşını ölç, yavaşlat.',
  },
  // EsteKlinik — teal (klinik/aksiyon)
  esteklinik: {
    name: 'EsteKlinik',
    bgFrom: 'from-[#064E3B]',
    bgVia: 'via-[#0A6347]',
    bgTo: 'to-[#053527]',
    cardBg: 'bg-[#0A6347]/40',
    cardBorder: 'border-[#10876B]/40',
    inputBg: 'bg-[#053527]',
    inputBorder: 'border-[#10876B]/40',
    inputFocus: 'focus:border-[#10876B]',
    buttonGradient: 'from-[#10876B] to-[#0E7559]',
    buttonHover: 'hover:from-[#0E7559] hover:to-[#0A6347]',
    iconGradient: 'from-[#10876B] to-[#0A6347]',
    accent: 'text-emerald-300',
    accentHover: 'hover:text-emerald-200',
    checkboxBg: 'bg-[#10876B] border-[#10876B]',
    ringPulse: 'bg-[#10876B]',
    subline: 'Onaylı klinik ekosistemine katıl.',
  },
  // EsteStore — şampanya bej + bordo + altın (ürün/süreklilik, lüks)
  estestore: {
    name: 'EsteStore',
    bgFrom: 'from-[#2A1F1A]',       // sıcak koyu kahve
    bgVia: 'via-[#3A2820]',         // şampanya kahve mid
    bgTo: 'to-[#1F1612]',           // derin kahve
    cardBg: 'bg-[#3A2820]/60',      // kart sıcak ton, koyu siyah değil
    cardBorder: 'border-[#D4B570]/25',
    inputBg: 'bg-[#1F1612]',        // siyah değil, kahve-siyah
    inputBorder: 'border-[#D4B570]/30',
    inputFocus: 'focus:border-[#D4B570]',
    buttonGradient: 'from-[#D4B570] to-[#8B3A3A]',  // altın → bordo
    buttonHover: 'hover:from-[#E0C485] hover:to-[#A04848]',
    iconGradient: 'from-[#D4B570] to-[#6B2A2A]',    // altın → derin bordo
    accent: 'text-[#E8D49E]',
    accentHover: 'hover:text-[#F2E2BA]',
    checkboxBg: 'bg-[#D4B570] border-[#D4B570]',
    ringPulse: 'bg-[#D4B570]',
    subline: 'Hekim puanlı ürünleri keşfet.',
  },
}

/** ?g= param'ından güvenli galaksi çözer (whitelist) */
export function resolveGalaxy(param: string | null | undefined): Galaxy {
  if (param && param in GALAXY_THEMES) return param as Galaxy
  return 'default'
}
