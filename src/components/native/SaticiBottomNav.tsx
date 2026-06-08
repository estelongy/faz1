'use client'

import { usePathname } from 'next/navigation'
import SafeLink from '@/components/SafeLink'
import { Home, Package, Truck, RotateCcw, Menu } from 'lucide-react'
import { useIsNativeApp } from './useIsNativeApp'
import { useEffect, useState } from 'react'

/**
 * Satıcı paneli için EsteStorePRO app'e özel alt tab bar.
 *
 * Yalnızca /satici/panel altında ve sadece Capacitor app'inde görünür.
 * Vendor iş akışına özel: Panel · Ürünler · Siparişler · İadeler · Menü.
 *
 * KlinikBottomNav'ın vendor karşılığı.
 */
const TABS: Array<{ href: string; label: string; Icon: typeof Home; prefix?: string }> = [
  { href: '/satici/panel', label: 'Panel', Icon: Home, prefix: undefined },
  { href: '/satici/panel/urunler', label: 'Ürün', Icon: Package, prefix: '/satici/panel/urunler' },
  { href: '/satici/panel/siparisler', label: 'Sipariş', Icon: Truck, prefix: '/satici/panel/siparisler' },
  { href: '/satici/panel/iadeler', label: 'İade', Icon: RotateCcw, prefix: '/satici/panel/iadeler' },
  { href: '/satici/panel/menu', label: 'Menü', Icon: Menu, prefix: '/satici/panel/menu' },
]

export default function SaticiBottomNav() {
  const isApp = useIsNativeApp()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!isApp || !mounted) return null
  if (!pathname.startsWith('/satici')) return null
  // Onboarding ekranında gizli — kullanıcı henüz giriş yapmadı.
  if (pathname.startsWith('/satici/karsilama')) return null

  const isActive = (t: typeof TABS[number]) => {
    if (t.prefix) return pathname.startsWith(t.prefix)
    return pathname === t.href
  }

  return (
    <>
      <div aria-hidden style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }} />
      <nav
        className="fixed bottom-0 inset-x-0 z-[70] bg-slate-900/95 backdrop-blur-lg border-t border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {TABS.map(({ href, label, Icon }) => {
            const active = isActive({ href, label, Icon })
            const cls = `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              active ? 'text-amber-400' : 'text-slate-500 active:text-slate-300'
            }`
            return (
              <SafeLink key={href} href={href} className={cls}>
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </SafeLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
