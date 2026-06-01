'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, CalendarCheck, ShoppingBag, User } from 'lucide-react'
import { useIsNativeApp } from './useIsNativeApp'
import { useGalaxyTransition, type Galaxy } from '@/components/GalaxyTransition'

type Tab = {
  href: string
  label: string
  Icon: typeof Home
  galaxy?: Galaxy // doluysa: tıklayınca galaksi ışınlanma geçişi oynar
}

/**
 * BiyoAGE app'inin alt tab bar'ı. Kendi galaksisinde (ölçüm/longevity) gezinir;
 * "Ana Sayfa" → /biyoage AppHome skor ekranına döner. EsteStore'a (Mağaza)
 * geçiş KALDIRILMADI — ama düz link değil: başka bir evrene ışınlanma gibi
 * GalaxyTransition overlay'i oynatılarak yapılır (kazara site'ye düşme hissi yok).
 */
const TABS: Tab[] = [
  { href: '/biyoage',       label: 'Ana Sayfa', Icon: Home },
  { href: '/analiz',        label: 'Analiz',    Icon: Camera },
  { href: '/esteklinik',    label: 'Randevu',   Icon: CalendarCheck, galaxy: 'esteklinik' },
  { href: '/estestore',     label: 'Mağaza',    Icon: ShoppingBag,   galaxy: 'estestore' },
  { href: '/panel/hesabim', label: 'Hesap',     Icon: User },
]

/**
 * Yalnızca Capacitor app içinde görünen native-tarzı alt tab bar.
 * Tarayıcıda/masaüstünde null render eder (web kullanıcısı görmez).
 */
export default function AppBottomNav() {
  const isApp = useIsNativeApp()
  const pathname = usePathname()
  const { transitionTo } = useGalaxyTransition()

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
          {TABS.map(({ href, label, Icon, galaxy }) => {
            const active =
              pathname === href || (href !== '/biyoage' && pathname.startsWith(href + '/'))
            const cls = `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              active ? 'text-violet-400' : 'text-slate-500 active:text-slate-300'
            }`
            const inner = (
              <>
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </>
            )

            // Başka galaksiye: ışınlanma geçişi (düz link değil)
            if (galaxy) {
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => transitionTo(galaxy, href)}
                  className={cls}
                >
                  {inner}
                </button>
              )
            }

            return (
              <Link key={href} href={href} className={cls}>
                {inner}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
