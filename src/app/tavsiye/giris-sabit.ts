/**
 * Referansör oturum sabitleri.
 *
 * Ayrı dosyada: 'use server' dosyasından yalnız async fonksiyon export
 * edilebilir, sabit ve yardımcı dışarı çıkamaz. Hem giris-actions
 * (çerezi kuran) hem page.tsx (çerezi okuyan) buradan okur.
 */

/**
 * Oturum çerezi adının sabit başı. Öneksiz giriş kapısı (/tavsiye) hangi
 * öneke ait olduğunu bilmeden çerez araması gerektiği için ayrı duruyor.
 */
export const CEREZ_ONEKI = 'ref_oturum_'

/** Oturum çerezi: hangi önek için giriş yapılmış. */
export const oturumCerez = (onek: string) => `${CEREZ_ONEKI}${onek.toUpperCase()}`

/** Çerez ömrü — aynı cihazda bu süre boyunca tekrar sorulmaz. */
export const OTURUM_GUN = 90
