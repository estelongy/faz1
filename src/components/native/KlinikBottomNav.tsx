'use client'

import { usePathname } from 'next/navigation'
import SafeLink from '@/components/SafeLink'
import { Home, Calendar, Users, MessageCircle, Menu } from 'lucide-react'
import { useIsNativeApp } from './useIsNativeApp'
import { useEffect, useState } from 'react'

/**
 * Klinik paneli için app'e özel alt tab bar.
 *
 * Yalnızca /klinik/panel altında ve sadece Capacitor app'inde görünür.
 * Hasta-flavor AppBottomNav (Skorum/Mağaza) burada gizli — klinik kullanıcısı
 * için yanıltıcı. Bu bar klinik iş akışına özel: Panel · Randevular ·
 * Hastalarım · Mesajlar · Menü (sidebar drawer'ı açar).
 *
 * Menü tab'ı sidebar drawer'ını açar (web'de sidebar zaten görünür; app'te
 * mobil-only drawer hamburger'ından açıyordu, şimdi alt bar'dan da erişilebilir).
 */
const TABS: Array<{ href: string; label: string; Icon: typeof Home; prefix?: string }> = [
  { href: '/klinik/panel', label: 'Panel', Icon: Home, prefix: undefined },
  { href: '/klinik/panel/takvim', label: 'Randevu', Icon: Calendar, prefix: '/klinik/panel/takvim' },
  { href: '/klinik/panel/hastalarim', label: 'Hastalar', Icon: Users, prefix: '/klinik/panel/hasta' },
  { href: '/klinik/panel/mesajlar', label: 'Mesaj', Icon: MessageCircle, prefix: '/klinik/panel/mesajlar' },
  { href: '/klinik/panel/menu', label: 'Menü', Icon: Menu, prefix: '/klinik/panel/menu' },
]

export default function KlinikBottomNav() {
  const isApp = useIsNativeApp()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!isApp || !mounted) return null
  if (!pathname.startsWith('/klinik')) return null

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
              active ? 'text-emerald-400' : 'text-slate-500 active:text-slate-300'
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
