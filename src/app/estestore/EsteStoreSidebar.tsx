'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { HASTA_CATEGORIES } from '@/lib/estestore-categories'

/**
 * Hover-tabanlı açılır-gizlenir kategori sidebar.
 * Default kapalı (72px ikon-only).
 * Mouse üstüne gelince açılır (280px), çıkınca kapanır.
 * Custom thin scrollbar — varsayılan çubuk gizli.
 *
 * Ürünler grid'i sağında oturur — overlap olmaz (push layout).
 */
export default function EsteStoreSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`shrink-0 sticky top-16 self-start h-[calc(100vh-64px)] bg-[#FAFAF7] border-r border-slate-200 transition-[width] duration-300 ease-out overflow-hidden ${
        open ? 'w-[280px]' : 'w-[72px]'
      }`}
    >
      <div className="h-full overflow-y-auto estestore-sidebar-scroll">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[#FAFAF7] border-b border-slate-200 h-12 flex items-center px-4">
          {open ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">
              Kategoriler
            </p>
          ) : (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                href={`/estestore/${cat.slug}`}
                title={!open ? cat.name : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all ${
                  cat.egpFocus ? 'border-l-2 border-[#C9A961]' : ''
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    cat.egpFocus ? 'bg-[#C9A961]/15' : 'bg-white border border-slate-200'
                  }`}
                >
                  <Icon
                    size={16}
                    className={cat.egpFocus ? 'text-[#8B7339]' : 'text-slate-500'}
                  />
                </span>
                <span
                  className={`flex-1 text-[13px] font-medium truncate leading-tight transition-opacity duration-200 ${
                    open ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {cat.shortName ?? cat.name}
                </span>
                {open && cat.bridgeToKlinik && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[#10876B] bg-[#10876B]/12 px-1.5 py-0.5 rounded">
                    Klinik
                  </span>
                )}
                {open && !cat.bridgeToKlinik && (
                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {open && (
          <div className="px-4 py-4 mt-2 border-t border-slate-200">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
              Diğer
            </p>
            <Link
              href="/estestore/tum-kategoriler"
              className="block text-[13px] text-slate-700 hover:text-slate-900 transition-colors py-1.5 font-medium"
            >
              Tüm Kategoriler →
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
