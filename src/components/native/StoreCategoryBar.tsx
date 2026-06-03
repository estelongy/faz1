'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { HASTA_CATEGORIES } from '@/lib/estestore-categories'

/**
 * App-only mağaza şeridi — NativeTopBar'ın hemen altında.
 *
 * Web header + hover sidebar app içinde gizlenince ARAMA ve KATEGORİLER de
 * kaybolmuştu. Bu şerit ikisini birden geri getirir (standart mobil mağaza
 * kalıbı): solda arama girişi (→ /estestore/ara), yanında yatay kaydırılır
 * kategori çipleri (→ /estestore/kategori/[slug]). Aktif kategori vurgulanır.
 *
 * `app-only` sınıfı sayesinde web'de hiç render edilmez (CSS gizler) — web
 * kullanıcısı zaten TopNav + sidebar görür.
 */
export default function StoreCategoryBar() {
  const pathname = usePathname()
  const activeSlug = pathname.startsWith('/estestore/kategori/')
    ? pathname.split('/estestore/kategori/')[1]?.split('/')[0]
    : null

  return (
    <div className="app-only bg-white border-b border-slate-200">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Arama girişi */}
        <Link
          href="/estestore/ara"
          aria-label="Ürün ara"
          className="shrink-0 inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-full bg-slate-100 text-slate-500 text-sm font-medium active:bg-slate-200 transition-colors"
        >
          <Search size={16} className="text-slate-400" />
          Ara
        </Link>

        {/* Kategori çipleri — yatay kaydırılır */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mr-3 pr-3">
          {HASTA_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = cat.slug === activeSlug
            return (
              <Link
                key={cat.slug}
                href={`/estestore/kategori/${cat.slug}`}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold border transition-colors ${
                  active
                    ? 'bg-[#0F172A] border-[#0F172A] text-white'
                    : cat.epFocus
                      ? 'bg-[#C9A961]/12 border-[#C9A961]/40 text-[#8B7339] active:bg-[#C9A961]/20'
                      : 'bg-white border-slate-200 text-slate-700 active:bg-slate-100'
                }`}
              >
                <Icon size={14} className={active ? 'text-white' : cat.epFocus ? 'text-[#C9A961]' : 'text-slate-400'} />
                {cat.shortName ?? cat.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
