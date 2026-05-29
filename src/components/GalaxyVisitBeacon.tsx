'use client'

import { useEffect } from 'react'

type Galaxy = 'biyoage' | 'esteklinik' | 'estestore'

/**
 * Galaksi landing'inde mount olunca tek sefer ziyaret beacon'ı atar.
 * Session başına galaksi başına 1 kez (sessionStorage dedupe) — sayım şişmesin.
 * "Return visitor" ölçümü sunucuda kalıcı eg_vid çerezi + farklı günlerle hesaplanır.
 */
export default function GalaxyVisitBeacon({ galaxy }: { galaxy: Galaxy }) {
  useEffect(() => {
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
