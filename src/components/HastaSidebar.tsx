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
      { href: '/panel',                icon: '🏠', label: 'Panel', exact: true },
      { href: '/analiz',               icon: '📸', label: 'Yeni Analiz' },
      { href: '/randevu',              icon: '📅', label: 'Randevu Al' },
      { href: '/panel/analizlerim',    icon: '🎯', label: 'Geçmişim' },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { href: '/panel/hesabim',        icon: '👤', label: 'Hesabım' },
      { href: '/panel/siparislerim',   icon: '📦', label: 'Siparişlerim' },
      { href: '/panel/iadelerim',      icon: '↩', label: 'İadelerim' },
      { href: '/panel/adreslerim',     icon: '📍', label: 'Adreslerim' },
    ],
  },
  {
    title: 'Topluluk',
    items: [
      { href: '/panel/referral',       icon: '🎁', label: 'Davet & Puan' },
      { href: '/panel/leaderboard',    icon: '🏆', label: 'Sıralama' },
    ],
  },
]

interface Props {
  userName: string | null
  pointsBalance: number
  hasClinicAccess: boolean
}

const PIN_KEY = 'estelongy_hasta_sidebar_pinned'

export default function HastaSidebar({ userName, pointsBalance, hasClinicAccess }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

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

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed top-0 left-0 bottom-0 bg-slate-900 border-r border-slate-800 z-50 flex flex-col transition-[width,transform] duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 ${expanded ? 'lg:w-64 lg:shadow-2xl lg:shadow-black/40' : 'lg:w-[72px]'}`}
      >

        {/* Kullanıcı kimlik kartı */}
        <div className="border-b border-slate-800 shrink-0">
          <Link href="/panel" className="flex items-center gap-2.5 p-4 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className={`min-w-0 transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              <p className="text-white font-bold text-sm truncate group-hover:text-violet-400 transition-colors">{userName ?? 'Kullanıcı'}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Estelongy</p>
            </div>
          </Link>

          {/* Puan rozeti */}
          <div className="px-4 pb-4">
            <Link
              href="/panel/referral"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center ${expanded ? 'justify-between px-3 py-2' : 'justify-center w-9 h-9'} rounded-lg border text-xs transition-all hover:opacity-80 text-amber-400 bg-amber-500/10 border-amber-500/30`}
              title={!expanded ? `${pointsBalance} puan` : undefined}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className={`font-bold transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden lg:hidden'}`}>{pointsBalance} Puan</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigasyon */}
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

        {/* Alt: Pin + Klinik geçişi + Anasayfa */}
        <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
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

          {hasClinicAccess && (
            <Link
              href="/klinik/panel"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors ${expanded ? '' : 'justify-center'}`}
              title={!expanded ? 'Klinik paneline geç' : undefined}
            >
              <span className="shrink-0">🏥</span>
              <span className={`transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Klinik Paneli</span>
            </Link>
          )}
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
