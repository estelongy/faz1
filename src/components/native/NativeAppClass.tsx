'use client'

import { useEffect } from 'react'
import { useIsNativeApp } from './useIsNativeApp'

/**
 * Sayfa Capacitor app içinde yükleniyorsa <html>'e `is-app` sınıfı ekler.
 * Böylece web-only chrome (pazarlama header'ı, landing) CSS ile gizlenebilir
 * ve app-only kabuk (AppHome, alt tab bar) öne çıkar.
 *
 * Tarayıcıda hiçbir şey yapmaz → web kullanıcısı etkilenmez.
 */
export default function NativeAppClass() {
  const isApp = useIsNativeApp()

  useEffect(() => {
    const el = document.documentElement
    if (isApp) el.classList.add('is-app')
    else el.classList.remove('is-app')
  }, [isApp])

  return null
}
