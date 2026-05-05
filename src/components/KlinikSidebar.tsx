'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NavItem {
  href: string
  icon: string
  label: string
  badge?: 'new' | 'soon' | number
  exact?: boolean
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/klinik/panel',           icon: '🏠', label: 'Panel', exact: true },
      { href: '/klinik/panel/randevular', icon: '📅', label: 'Randevular' },
      { href: '/klinik/panel/hastalarim', icon: '👥', label: 'Hastalarım' },
      { href: '/klinik/panel/jeton',      icon: '💳', label: 'Krediler' },
      { href: '/klinik/panel/rapor',      icon: '📊', label: 'Raporlar' },
    ],
  },
  {
    title: 'Topluluk',
    items: [
      { href: '/klinik/panel/akademi',    icon: '📰', label: 'Akademi',     badge: 'soon' },
      { href: '/klinik/panel/pazarlama',  icon: '📱', label: 'Pazarlama',   badge: 'soon' },
      { href: '/klinik/panel/topluluk',   icon: '💬', label: 'Topluluk',    badge: 'soon' },
      { href: '/klinik/panel/destek',     icon: '🛟', label: 'Destek' },
    ],
  },
  {
    title: 'Klinik',
    items: [
      { href: '/klinik/panel/profil',     icon: '🏥', label: 'Klinik Profilim' },
    ],
  },
]

interface Props {
  clinicName: string
  totalCredit: number
  freeCredit: number
}

const PIN_KEY = 'estelongy_klinik_sidebar_pinned'

export default function KlinikSidebar({ clinicName, totalCredit, freeCredit }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

  // localStorage'tan pin state'i yükle
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PIN_KEY)
      if (stored === '1') setPinned(true)
    } catch {}
  }, [])

  function togglePin() {
    setPinned(prev => {
      const next = !prev
      try { localStorage.setItem(PIN_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }

  const expanded = pinned || hovered

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const creditColor =
    totalCredit === 0 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    totalCredit <= 10 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'

  return (
    <>
      {/* Mobil hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-slate-800 border border-slate-700 text-white shadow-lg"
        aria-label="Menü"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      {/* Sidebar
          Mobile: tam 264px drawer, slide-in
          Desktop: 72px collapsed, hover veya pin ile 264px expand (overlay) */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed top-0 left-0 bottom-0 bg-slate-900 border-r border-slate-800 z-50 flex flex-col transition-[width,transform] duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 ${expanded ? 'lg:w-64 lg:shadow-2xl lg:shadow-black/40' : 'lg:w-[72px]'}`}
      >

        {/* Klinik kimlik kartı */}
        <div className="border-b border-slate-800 shrink-0">
          <Link href="/klinik/panel" className="flex items-center gap-2.5 p-4 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className={`min-w-0 transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              <p className="text-white font-bold text-sm truncate group-hover:text-violet-400 transition-colors">{clinicName}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Estelongy Klinik</p>
            </div>
          </Link>

          {/* Kredi rozeti — collapsed modda kompakt ikon, expanded modda tam */}
          <div className="px-4 pb-4">
            <Link
              href="/klinik/panel/jeton"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center ${expanded ? 'justify-between px-3 py-2' : 'justify-center w-9 h-9'} rounded-lg border text-xs transition-all hover:opacity-80 ${creditColor}`}
              title={!expanded ? `${totalCredit} kredi` : undefined}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className={`font-bold transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden lg:hidden'}`}>{totalCredit} Kredi</span>
              </div>
              {freeCredit > 0 && expanded && <span className="opacity-70 text-[10px]">{freeCredit} hediye</span>}
            </Link>
          </div>
        </div>

        {/* Navigasyon — scrollable, ince scrollbar sadece scroll esnasında */}
        <nav className={`flex-1 overflow-y-auto p-3 space-y-5 ${expanded ? 'klinik-sidebar-scroll' : 'klinik-sidebar-scroll-hidden'}`}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && expanded && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 px-2">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href, item.exact)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={!expanded ? item.label : undefined}
                      className={`group/item relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-violet-500/15 text-white border border-violet-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                      } ${expanded ? '' : 'justify-center'}`}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className={`flex-1 truncate transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>{item.label}</span>
                      {expanded && item.badge === 'soon' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 uppercase tracking-wider">Yakında</span>
                      )}
                      {expanded && item.badge === 'new' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">Yeni</span>
                      )}
                      {expanded && typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">{item.badge}</span>
                      )}

                      {/* Collapsed modda tooltip */}
                      {!expanded && (
                        <span className="hidden lg:group-hover/item:block absolute left-[60px] top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-white text-xs whitespace-nowrap shadow-xl z-[60]">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Alt: Pin toggle + Estelongy bağlantıları */}
        <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
          {/* Pin butonu — sadece desktop */}
          <button
            onClick={togglePin}
            className={`hidden lg:flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              pinned
                ? 'text-violet-300 bg-violet-500/10 border border-violet-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 border border-transparent'
            } ${expanded ? '' : 'justify-center'}`}
            title={pinned ? 'Açık moddan çık' : 'Sürekli açık tut'}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {pinned
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l4 14h6l4-14M9 5h6" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l14 14M5 5l4 14h6l4-14M9 5h6" />
              }
            </svg>
            <span className={`flex-1 text-left transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
              {pinned ? 'Açık tutuluyor' : 'Sürekli aç'}
            </span>
          </button>

          <Link
            href="/panel"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors ${expanded ? '' : 'justify-center'}`}
            title={!expanded ? 'Hasta paneline geç' : undefined}
          >
            <span className="shrink-0">←</span>
            <span className={`transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Hasta Paneline Geç</span>
          </Link>
          <Link
            href="/"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors ${expanded ? '' : 'justify-center'}`}
            title={!expanded ? 'Anasayfa' : undefined}
          >
            <span className="shrink-0">⌂</span>
            <span className={`transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Anasayfa</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
