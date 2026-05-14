'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { HASTA_CATEGORIES } from '@/lib/estestore-categories'

/**
 * Açılır-gizlenir kategori sidebar.
 * Açık: 280px genişlik + tüm 18 kategori listesi
 * Kapalı: 64px sadece toggle butonu + ikon-only kategoriler
 *
 * Ürünler grid'i sağında oturur — overlap olmaz (push layout).
 */
export default function EsteStoreSidebar({
  defaultOpen = true,
}: {
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <aside
      className={`shrink-0 sticky top-16 self-start h-[calc(100vh-64px)] overflow-y-auto bg-[#0F172A]/95 backdrop-blur-md border-r border-slate-800/60 transition-[width] duration-300 ease-out ${
        open ? 'w-[280px]' : 'w-[64px]'
      }`}
    >
      {/* Toggle header */}
      <div className="sticky top-0 z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/60 px-3 py-3 flex items-center justify-between gap-2">
        {open && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Kategoriler
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Kategori panelini kapat' : 'Kategori panelini aç'}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors"
        >
          {open ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
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
              className={`group flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-lg text-slate-300 hover:bg-slate-800/60 hover:text-slate-50 transition-colors ${
                cat.egpFocus ? 'border-l-2 border-[#C9A961]/60' : ''
              }`}
            >
              <span
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  cat.egpFocus ? 'bg-[#C9A961]/15' : 'bg-slate-800/60'
                }`}
              >
                <Icon
                  size={16}
                  className={cat.egpFocus ? 'text-[#C9A961]' : 'text-slate-400'}
                />
              </span>
              {open && (
                <span className="flex-1 text-[13px] font-medium truncate leading-tight">
                  {cat.shortName ?? cat.name}
                </span>
              )}
              {open && cat.bridgeToKlinik && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#10876B] bg-[#10876B]/15 px-1.5 py-0.5 rounded">
                  Klinik
                </span>
              )}
              {open && !cat.bridgeToKlinik && (
                <ChevronRight
                  size={14}
                  className="text-slate-600 group-hover:text-slate-300 transition-colors shrink-0"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {open && (
        <div className="px-4 py-4 mt-2 border-t border-slate-800/60">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Diğer
          </p>
          <Link
            href="/estestore/tum-kategoriler"
            className="block text-[13px] text-slate-300 hover:text-slate-50 transition-colors py-1.5"
          >
            Tüm Kategoriler →
          </Link>
        </div>
      )}
    </aside>
  )
}
