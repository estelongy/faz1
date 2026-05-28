'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOutAction } from '@/app/panel/actions'

interface NavItem {
  href: string
  icon: string
  label: string
  badge?: number
  exact?: boolean
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

interface Counts {
  pendingOrders: number
  returnRequests: number
  openQuestions: number
  openReviews: number
}

interface Props {
  companyName: string
  approvalStatus: string
  performanceLetter: 'A' | 'B' | 'C' | 'D' | 'F'
  performanceScore: number
  counts: Counts
}

const PIN_KEY = 'estelongy_satici_sidebar_pinned'

export default function SaticiSidebar({ companyName, approvalStatus, performanceLetter, performanceScore, counts }: Props) {
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

  const NAV_GROUPS: NavGroup[] = [
    {
      items: [
        { href: '/satici/panel', icon: '🏠', label: 'Panel', exact: true },
      ],
    },
    {
      title: 'Özet',
      items: [
        { href: '/satici/panel/siparisler', icon: '📦', label: 'Siparişler', badge: counts.pendingOrders },
        { href: '/satici/panel/iadeler',    icon: '↩',  label: 'İadeler',    badge: counts.returnRequests },
        { href: '/satici/panel/sorular',    icon: '💬', label: 'Sorular',    badge: counts.openQuestions },
        { href: '/satici/panel/yorumlar',   icon: '⭐', label: 'Yorumlar',   badge: counts.openReviews },
      ],
    },
    {
      title: 'Ürün',
      items: [
        { href: '/satici/panel/urunler',        icon: '🛍️', label: 'Ürünlerim' },
        { href: '/satici/panel/urunler/toplu',  icon: '📤', label: 'Toplu Yükle' },
      ],
    },
    {
      title: 'Mağaza',
      items: [
        { href: '/satici/panel/magaza',     icon: '🎨', label: 'Vitrin' },
        { href: '/satici/panel/kargo',      icon: '🚚', label: 'Kargo Ayarları' },
        { href: '/satici/panel/performans', icon: '📊', label: 'Performans' },
      ],
    },
    {
      title: 'Finans',
      items: [
        { href: '/satici/panel/kazanc',        icon: '💰', label: 'Kazançlar' },
        { href: '/satici/panel/odeme-hesabi',  icon: '💳', label: 'Ödeme Hesabı' },
      ],
    },
    {
      title: 'Hesap',
      items: [
        { href: '/satici/panel/hesabim', icon: '👤', label: 'Hesabım' },
        { href: '/satici/panel/kyc',     icon: '📋', label: 'Belgelerim' },
      ],
    },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const perfColor =
    performanceLetter === 'A' ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' :
    performanceLetter === 'B' ? 'text-[#D4B872] bg-[#C9A961]/15 border-[#C9A961]/30' :
    performanceLetter === 'C' ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' :
    performanceLetter === 'D' ? 'text-orange-300 bg-orange-500/15 border-orange-500/30' :
                                'text-red-300 bg-red-500/15 border-red-500/30'

  const statusBadge =
    approvalStatus === 'approved' ? { text: 'Onaylı', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' } :
    approvalStatus === 'pending'  ? { text: 'Beklemede', cls: 'text-[#C9A961] bg-[#C9A961]/10 border-[#C9A961]/30' } :
                                    { text: approvalStatus, cls: 'text-slate-400 bg-slate-700/40 border-slate-600' }

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
        {/* Vendor kimlik kartı */}
        <div className="border-b border-slate-800 shrink-0">
          <Link href="/satici/panel" className="flex items-center gap-2.5 p-4 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-[#C9A961] to-[#8B7339]">
              <span className="text-white text-base">🛍️</span>
            </div>
            <div className={`min-w-0 transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              <p className="font-bold text-sm truncate text-white group-hover:text-[#D4B872] transition-colors">
                {companyName}
              </p>
              <p className="text-slate-500 text-sm uppercase tracking-widest">İş Ortağı</p>
            </div>
          </Link>

          {/* Onay rozeti + perf chip */}
          <div className="px-4 pb-4 space-y-2">
            <div className={`flex items-center ${expanded ? 'justify-between px-3 py-2' : 'justify-center w-9 h-9'} rounded-lg border text-sm ${statusBadge.cls}`}
              title={!expanded ? statusBadge.text : undefined}>
              <span className="text-xs font-bold uppercase tracking-wider">
                {expanded ? statusBadge.text : statusBadge.text[0]}
              </span>
            </div>

            <Link
              href="/satici/panel/performans"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center ${expanded ? 'justify-between px-3 py-2' : 'justify-center w-9 h-9'} rounded-lg border text-sm transition-all hover:opacity-80 ${perfColor}`}
              title={!expanded ? `Performans ${performanceLetter} · ${performanceScore}/100` : undefined}
            >
              <span className="font-bold">{expanded ? `Performans ${performanceLetter}` : performanceLetter}</span>
              {expanded && <span className="text-sm">{performanceScore}/100</span>}
            </Link>
          </div>
        </div>

        {/* Navigasyon */}
        <nav className={`flex-1 overflow-y-auto p-3 space-y-5 ${expanded ? 'klinik-sidebar-scroll' : 'klinik-sidebar-scroll-hidden'}`}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && expanded && (
                <p className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-1.5 px-2">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href, item.exact)
                  const hasBadge = typeof item.badge === 'number' && item.badge > 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={!expanded ? item.label : undefined}
                      className={`group/item relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-[#C9A961]/15 text-white border border-[#C9A961]/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                      } ${expanded ? '' : 'justify-center'}`}
                    >
                      <span className="text-base shrink-0 relative">
                        {item.icon}
                        {hasBadge && !expanded && (
                          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {item.badge! > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </span>
                      <span className={`flex-1 truncate transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>{item.label}</span>
                      {expanded && hasBadge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 min-w-[20px] text-center">
                          {item.badge! > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {!expanded && (
                        <span className="hidden lg:group-hover/item:block absolute left-[60px] top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-white text-sm whitespace-nowrap shadow-xl z-[60]">
                          {item.label}{hasBadge ? ` (${item.badge})` : ''}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Alt: Pin + Mağazamı Gör + Anasayfa + Çıkış */}
        <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
          <button
            onClick={togglePin}
            className={`hidden lg:flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              pinned
                ? 'text-[#D4B872] bg-[#C9A961]/10 border border-[#C9A961]/30'
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
            href="/estestore"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors ${expanded ? '' : 'justify-center'}`}
            title={!expanded ? 'EsteStore (müşteri görünümü)' : undefined}
          >
            <span className="shrink-0">🛒</span>
            <span className={`transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>EsteStore</span>
          </Link>

          <Link
            href="/"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors ${expanded ? '' : 'justify-center'}`}
            title={!expanded ? 'Anasayfa' : undefined}
          >
            <span className="shrink-0">⌂</span>
            <span className={`transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Anasayfa</span>
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors ${expanded ? '' : 'justify-center'}`}
              title={!expanded ? 'Çıkış Yap' : undefined}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className={`transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Çıkış Yap</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
