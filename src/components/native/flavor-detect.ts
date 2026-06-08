/**
 * Flavor tespitinin SAF kısmı — 'use client' YOK, hem server (headers) hem
 * client (UA/sınıf) tarafında kullanılabilsin. Hook'lar flavor.ts'te.
 */
export type Flavor = 'biyoage' | 'esteklinik' | 'estestore' | 'esteklinikpro' | 'estestorepro'

/** Her flavor'ın "ev" rotası — açılış + alt-nav Ana Sayfa + geri-çekim hedefi. */
export const FLAVOR_HOME: Record<Flavor, string> = {
  biyoage: '/biyoage',
  esteklinik: '/esteklinik',
  estestore: '/estestore',
  esteklinikpro: '/klinik/panel',
  estestorepro: '/satici/panel',
}

const FLAVORS: Flavor[] = ['biyoage', 'esteklinik', 'estestore', 'esteklinikpro', 'estestorepro']

/** PRO flavor'lar — saf kullanıcı değil, profesyonel persona (klinik/vendor). */
export const PRO_FLAVORS: Flavor[] = ['esteklinikpro', 'estestorepro']

export function isProFlavor(f: Flavor): boolean {
  return PRO_FLAVORS.includes(f)
}

export function isFlavor(v: string): v is Flavor {
  return (FLAVORS as string[]).includes(v)
}

/** UA string'inden flavor çıkar: "EstelongyApp/esteklinik" → 'esteklinik'. */
export function detectFlavorFromUA(ua: string): Flavor {
  const m = ua.match(/EstelongyApp\/([a-z]+)/i)
  if (m && isFlavor(m[1].toLowerCase())) return m[1].toLowerCase() as Flavor
  return 'biyoage'
}
