/**
 * Referansör oturum sabitleri.
 *
 * Ayrı dosyada: 'use server' dosyasından yalnız async fonksiyon export
 * edilebilir, sabit ve yardımcı dışarı çıkamaz. Hem giris-actions
 * (çerezi kuran) hem page.tsx (çerezi okuyan) buradan okur.
 */

/** Oturum çerezi: hangi önek için giriş yapılmış. */
export const oturumCerez = (onek: string) => `ref_oturum_${onek.toUpperCase()}`

/** Çerez ömrü — aynı cihazda bu süre boyunca tekrar sorulmaz. */
export const OTURUM_GUN = 90
