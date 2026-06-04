'use client'

import { usePathname } from 'next/navigation'
import { useIsNativeApp } from './useIsNativeApp'
import { useFlavor, FLAVOR_HOME } from './flavor'

/**
 * NativeTopBar'ın (fixed) altında içeriğin kalmaması için boşluk — ama YALNIZCA
 * bar gerçekten varken. Flavor'ın evinde (başrol galaksi landing'i) NativeTopBar
 * gizlidir → orada bu spacer da render edilmez (yoksa 56px boş bant kalırdı).
 *
 * Galaksi landing'leri (/esteklinik, /estestore) bir flavor'da ev, başka
 * flavor'da alt-sayfadır; bu yüzden spacer statik `app-only` olamaz, flavor-
 * bilinçli olmalı. Diğer alt-sayfalar hiçbir flavor'da ev değildir → orada her
 * zaman gösterilir (pathname ev'e eşit olmadığından).
 */
export default function AppTopSpacer() {
  const isApp = useIsNativeApp()
  const flavor = useFlavor()
  const pathname = usePathname()
  if (!isApp) return null
  // Evde: bar yok ama içerik status bar/notch altında kalmasın → sadece safe-area.
  // Alt-sayfada: NativeTopBar (56px) + safe-area kadar boşluk.
  const onHome = pathname === FLAVOR_HOME[flavor]
  return (
    <div
      aria-hidden
      style={{ height: onHome ? 'env(safe-area-inset-top)' : 'calc(56px + env(safe-area-inset-top))' }}
    />
  )
}
