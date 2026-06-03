'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsNativeApp } from './useIsNativeApp'

/**
 * App içinde umbrella root "/" (çatı) ASLA gösterilmez.
 *
 * Capacitor app'i her zaman /biyoage AppHome'a aittir. Çıkış (signOut →
 * redirect('/')), hesap silme (redirect('/?deleted=1')), home-drift (WebView'in
 * son URL'i "/" olabilir) veya herhangi bir stray "/" navigasyonu olduğunda
 * bu komponent kullanıcıyı sessizce /biyoage'e ışınlar.
 *
 * Web flash YOK: umbrella <main> `web-only` ile CSS'te (boyamadan önce, inline
 * head script `is-app`'i ekledikten sonra) gizlenir; html.is-app zemini koyu;
 * bu komponent ek bir koyu örtü de basar → kullanıcı çatı web sitesini hiç görmez.
 *
 * Web'de (tarayıcı) null render eder → çatı normal görünür.
 */
export default function NativeHomeRedirect() {
  const isApp = useIsNativeApp()
  const router = useRouter()

  useEffect(() => {
    if (isApp) router.replace('/biyoage')
  }, [isApp, router])

  if (!isApp) return null
  return <div className="fixed inset-0 z-[200] bg-[#160F28]" aria-hidden />
}
