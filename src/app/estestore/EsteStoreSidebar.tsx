'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { HASTA_CATEGORIES } from '@/lib/estestore-categories'

/**
 * Hover-tabanlı açılır-gizlenir kategori sidebar.
 * Default kapalı (72px ikon-only). Mouse üstüne gelince açılır (280px).
 * Lacivert zemin — ürün grid'i (beyaz) ile keskin kontrast.
 */
export default function EsteStoreSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`shrink-0 sticky top-16 self-start h-[calc(100vh-64px)] bg-[#0F172A] border-r border-slate-800 transition-[width] duration-300 ease-out overflow-hidden ${
        open ? 'w-[280px]' : 'w-[72px]'
      }`}
    >
      <div className="h-full overflow-y-auto estestore-sidebar-scroll">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[#0F172A] border-b border-slate-800 h-12 flex items-center px-4">
          {open ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C9A961] whitespace-nowrap">
              Kategoriler
            </p>
          ) : (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              ☰
            </p>
          )}
        </div>

        {/* Kategori listesi */}
        <nav className="py-2">
          {HASTA_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/estestore/kategori/${cat.slug}`}
                title={!open ? cat.name : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition-all ${
                  cat.epFocus ? 'border-l-2 border-[#C9A961]' : ''
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    cat.epFocus ? 'bg-[#C9A961]/15' : 'bg-slate-800/60 border border-slate-700/60'
                  }`}
                >
                  <Icon
                    size={16}
                    className={cat.epFocus ? 'text-[#C9A961]' : 'text-slate-400'}
                  />
                </span>
                <span
                  className={`flex-1 text-sm font-medium truncate leading-tight transition-opacity duration-200 ${
                    open ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {cat.shortName ?? cat.name}
                </span>
                {open && cat.bridgeToKlinik && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[#10876B] bg-[#10876B]/20 px-1.5 py-0.5 rounded">
                    Klinik
                  </span>
                )}
                {open && !cat.bridgeToKlinik && (
                  <ChevronRight
                    size={14}
                    className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {open && (
          <div className="px-4 py-4 mt-2 border-t border-slate-800">
            <p className="text-sm uppercase tracking-[0.18em] text-[#C9A961] mb-2">
              Diğer
            </p>
            <Link
              href="/estestore/kategori/tum-kategoriler"
              className="block text-base text-slate-300 hover:text-white transition-colors py-1.5 font-medium"
            >
              Tüm Kategoriler →
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
