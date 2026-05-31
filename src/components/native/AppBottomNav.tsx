'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, Activity, ShoppingBag, User } from 'lucide-react'
import { useIsNativeApp } from './useIsNativeApp'

const TABS = [
  { href: '/panel',           label: 'Panel',  Icon: Home },
  { href: '/analiz',          label: 'Analiz', Icon: Camera },
  { href: '/skor',            label: 'Skor',   Icon: Activity },
  { href: '/estestore',       label: 'Mağaza', Icon: ShoppingBag },
  { href: '/panel/hesabim',   label: 'Hesap',  Icon: User },
]

/**
 * DENEME DİLİMİ — yalnızca Capacitor app içinde görünen native-tarzı alt tab bar.
 * Tarayıcıda/masaüstünde null render eder (web kullanıcısı görmez).
 */
export default function AppBottomNav() {
  const isApp = useIsNativeApp()
  const pathname = usePathname()

  if (!isApp) return null

  return (
    <>
      {/* İçeriğin bar arkasında kalmaması için boşluk */}
      <div aria-hidden style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }} />

      <nav
        className="fixed bottom-0 inset-x-0 z-[70] bg-slate-900/95 backdrop-blur-lg border-t border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/panel' && pathname.startsWith(href + '/')) || pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  active ? 'text-violet-400' : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
