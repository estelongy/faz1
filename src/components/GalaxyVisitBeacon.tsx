'use client'

import { useEffect } from 'react'

type Galaxy = 'biyoage' | 'esteklinik' | 'estestore'

/**
 * Galaksi landing'inde mount olunca tek sefer ziyaret beacon'ı atar.
 * Session başına galaksi başına 1 kez (sessionStorage dedupe) — sayım şişmesin.
 *
 * KVKK: yalnızca analitik consent verildiyse atılır. Consent yoksa hiç istek gitmez.
 */
export default function GalaxyVisitBeacon({ galaxy }: { galaxy: Galaxy }) {
  useEffect(() => {
    // Consent kontrolü — cookie tek-doğruluk-kaynağı (server-side okuyabilsin diye)
    if (!hasAnalyticsConsent()) return

    const key = `eg_seen_${galaxy}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* private mode — yine de beacon atmayı dene */
    }
    fetch('/api/track/galaxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ galaxy, event: 'visit' }),
      keepalive: true,
    }).catch(() => {})
  }, [galaxy])

  return null
}

function hasAnalyticsConsent(): boolean {
  if (typeof document === 'undefined') return false
  const m = document.cookie.match(/(?:^|;\s*)eg_consent=([^;]+)/)
  if (!m) return false
  // Token formatı: "n", "na", "nm", "nam" — 'a' içeriyorsa analytics açık
  return m[1].includes('a')
}
