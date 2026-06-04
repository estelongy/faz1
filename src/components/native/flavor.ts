'use client'

import { useEffect, useState } from 'react'
import { detectFlavorFromUA, isFlavor, type Flavor } from './flavor-detect'

/**
 * App FLAVOR — "başrol". Aynı web sitesini açan 3 farklı app'ten hangisi?
 * Saf tespit + sabitler flavor-detect.ts'te (server'dan da kullanılır); burada
 * client hook'u var. Geriye uyumluluk için sabitleri/tipi re-export ediyoruz.
 *
 * Tespit: Capacitor `appendUserAgent` her flavor'a `EstelongyApp/<galaxy>`
 * etiketi koyar. Pre-paint head script bunu `<html>`'e `flavor-<galaxy>` sınıfı
 * olarak da yazar (FOUC'suz okuma). Etiket yoksa → 'biyoage' (geriye uyumlu).
 */
export { FLAVOR_HOME, detectFlavorFromUA } from './flavor-detect'
export type { Flavor } from './flavor-detect'

/** Tarayıcı ortamında flavor: önce pre-paint <html> sınıfı, sonra UA. */
function detectFlavorFromEnv(): Flavor {
  try {
    const cls = document.documentElement.className
    const m = cls.match(/flavor-([a-z]+)/i)
    if (m && isFlavor(m[1].toLowerCase())) return m[1].toLowerCase() as Flavor
    return detectFlavorFromUA(navigator.userAgent)
  } catch {
    return 'biyoage'
  }
}

/**
 * Aktif flavor. SSR'da/ilk render'da 'biyoage' (varsayılan); mount sonrası
 * gerçek flavor'a düzelir. Native kabuk komponentleri zaten mount sonrası
 * isApp ile düzeldiği için ekstra flash yaratmaz.
 */
export function useFlavor(): Flavor {
  const [flavor, setFlavor] = useState<Flavor>('biyoage')
  useEffect(() => {
    setFlavor(detectFlavorFromEnv())
  }, [])
  return flavor
}
