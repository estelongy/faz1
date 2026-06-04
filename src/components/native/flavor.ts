'use client'

import { useEffect, useState } from 'react'

/**
 * App FLAVOR — "başrol". Aynı web sitesini açan 3 farklı app'ten hangisi?
 *
 * App Başrol Modeli: 3 app = tek Estelongy'nin 3 temalı versiyonu. Ayırt edici
 * unsur ışınlama DEĞİL, başrol: her app kendi galaksisinde "ev" kurar, alt-nav +
 * geri-çekimi + (sonraki aşamada) analiz rolü o başrole göre recast olur.
 *
 * Tespit: Capacitor `appendUserAgent` her flavor'a farklı etiket koyar —
 * `EstelongyApp/esteklinik` gibi. Pre-paint head script bunu `<html>`'e
 * `flavor-<galaxy>` sınıfı olarak da yazar (FOUC'suz okuma için).
 * Etiket yoksa (eski/biyoage build) → 'biyoage' (geriye uyumlu varsayılan).
 */
export type Flavor = 'biyoage' | 'esteklinik' | 'estestore'

/** Her flavor'ın "ev" rotası — açılış + alt-nav Ana Sayfa + geri-çekim hedefi. */
export const FLAVOR_HOME: Record<Flavor, string> = {
  biyoage: '/biyoage',
  esteklinik: '/esteklinik',
  estestore: '/estestore',
}

const FLAVORS: Flavor[] = ['biyoage', 'esteklinik', 'estestore']

function isFlavor(v: string): v is Flavor {
  return (FLAVORS as string[]).includes(v)
}

/** UA string'inden flavor çıkar: "EstelongyApp/esteklinik" → 'esteklinik'. */
export function detectFlavorFromUA(ua: string): Flavor {
  const m = ua.match(/EstelongyApp\/([a-z]+)/i)
  if (m && isFlavor(m[1].toLowerCase())) return m[1].toLowerCase() as Flavor
  return 'biyoage'
}

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
