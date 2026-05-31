'use client'

import { useEffect, useState } from 'react'

/**
 * Sayfa Capacitor mobil uygulaması içinde mi yükleniyor, yoksa normal
 * tarayıcıda mı? App içindeyken native-tarzı kabuk (alt tab bar, geçişler,
 * header gizleme) göstermek için kullanılır.
 *
 * Tespit: Capacitor native runtime her sayfaya `window.Capacitor` bridge'ini
 * enjekte eder; ayrıca capacitor.config'teki appendUserAgent ile UA'ya
 * "EstelongyApp" eklenir. İkisinden biri yeterli.
 *
 * SSR'da/tarayıcıda her zaman false döner → web kullanıcısı hiçbir değişiklik
 * görmez (komponentler null render eder).
 */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false)

  useEffect(() => {
    try {
      const cap = (window as unknown as {
        Capacitor?: { isNativePlatform?: () => boolean }
      }).Capacitor
      const byBridge = typeof cap?.isNativePlatform === 'function' ? cap.isNativePlatform() : false
      const byUA = /EstelongyApp|Capacitor/i.test(navigator.userAgent)
      setNative(Boolean(byBridge || byUA))
    } catch {
      /* tarayıcı ortamı değil — false kalır */
    }
  }, [])

  return native
}
