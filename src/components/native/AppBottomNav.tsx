'use client'

import { usePathname } from 'next/navigation'
import { Home, Camera, CalendarCheck, ShoppingBag, User, Activity } from 'lucide-react'
import SafeLink from '@/components/SafeLink'
import { useIsNativeApp } from './useIsNativeApp'
import { useGalaxyTransition, type Galaxy } from '@/components/GalaxyTransition'
import { useFlavor, FLAVOR_HOME, type Flavor } from './flavor'

type Tab = {
  href: string
  label: string
  Icon: typeof Home
  galaxy?: Galaxy // doluysa: tıklayınca galaksi ışınlanma geçişi oynar
}

/**
 * App'in alt tab bar'ı — FLAVOR'a göre recast olur (App Başrol Modeli).
 *
 * Desen her flavor'da aynı: [Ana Sayfa = başrol evi] · [Analiz] · [diğer 2
 * galaksi switcher] · [Hesap]. Başrol galaksisi "ev" olur (düz nav, overlay yok);
 * diğer iki galaksiye geçiş ışınlanma overlay'iyle (kazara siteye düşme hissi yok).
 *
 * - BiyoAGE app: Ana Sayfa(/biyoage) · Analiz · Randevu · Mağaza · Hesap
 * - EsteKlinik app: Ana Sayfa(/esteklinik) · Analiz · Skorum · Mağaza · Hesap
 * - EsteStore app: Ana Sayfa(/estestore) · Analiz · Skorum · Randevu · Hesap
 */
const GALAXY_TAB: Record<Flavor, Tab> = {
  biyoage:    { href: '/biyoage',    label: 'Skorum',  Icon: Activity,      galaxy: 'biyoage' },
  esteklinik: { href: '/esteklinik', label: 'Randevu', Icon: CalendarCheck, galaxy: 'esteklinik' },
  estestore:  { href: '/estestore',  label: 'Mağaza',  Icon: ShoppingBag,   galaxy: 'estestore' },
}
const ANALIZ_TAB: Tab = { href: '/analiz', label: 'Analiz', Icon: Camera }
const HESAP_TAB: Tab = { href: '/panel', label: 'Hesap', Icon: User }
const ALL_FLAVORS: Flavor[] = ['biyoage', 'esteklinik', 'estestore']

function tabsForFlavor(flavor: Flavor): Tab[] {
  // Başrol = ev (düz nav, galaxy yok). Diğer iki galaksi = switcher.
  const home: Tab = { href: FLAVOR_HOME[flavor], label: 'Ana Sayfa', Icon: Home }
  const others = ALL_FLAVORS.filter((g) => g !== flavor).map((g) => GALAXY_TAB[g])
  return [home, ANALIZ_TAB, others[0], others[1], HESAP_TAB]
}

/**
 * Yalnızca Capacitor app içinde görünen native-tarzı alt tab bar.
 * Tarayıcıda/masaüstünde null render eder (web kullanıcısı görmez).
 */
export default function AppBottomNav() {
  const isApp = useIsNativeApp()
  const flavor = useFlavor()
  const pathname = usePathname()
  const { transitionTo } = useGalaxyTransition()

  if (!isApp) return null

  const TABS = tabsForFlavor(flavor)

  // Auth / geçiş ekranlarında alt tab bar gösterilmez. Giriş bir "sekme" değil;
  // ayrıca min-h-screen giriş sayfasının altına eklenen spacer boşluğu sayfayı
  // ~60px taşırıp gereksiz dikey kaymaya yol açıyordu.
  const isAuthRoute =
    pathname.startsWith('/giris') ||
    pathname.startsWith('/kayit') ||
    pathname.startsWith('/kurumsal/giris')
  if (isAuthRoute) return null

  // Profesyonel paneller (klinik / satıcı / admin) ayrı sahneler — kendi
  // sidebar'ları var. Hasta-flavor bottom nav (Skorum/Mağaza/Randevu) bu
  // kullanıcılar için yanıltıcı → gizle. Yönlendirme ilgili sidebar'dan.
  if (
    pathname.startsWith('/klinik') ||
    pathname.startsWith('/satici') ||
    pathname.startsWith('/admin')
  ) return null

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
            const active = pathname === href || pathname.startsWith(href + '/')
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

            // İç sekme: SafeLink → auth-gated route'ta galaksi-bilinçli giriş
            // (çatı /giris değil, /giris?g=biyoage), geri dönüşle.
            return (
              <SafeLink key={href} href={href} className={cls}>
                {inner}
              </SafeLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
