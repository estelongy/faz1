'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatTRY } from '@/lib/estestore'
import type { RecentlyViewedItem } from './RecentlyViewedTracker'

const KEY = 'estestore.recentlyViewed.v1'

function RVImage({ src, alt, dark }: { src: string; alt: string; dark: boolean }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    const initial = (alt?.trim()[0] ?? '✦').toUpperCase()
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        {!dark && <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,97,0.10),transparent_55%)]" />}
        <span className={`relative font-black select-none leading-none text-[64px] tracking-tight ${dark ? 'text-slate-700' : 'text-[#8B7339]/30'}`}>
          {initial}
        </span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
  )
}

interface Props {
  /** Hariç tutulacak ürün ID — ürün detay sayfasında o ürünü gösterme */
  excludeId?: string
  /** Maksimum gösterilecek ürün (default 8) */
  limit?: number
  /** Başlık — default "Son Baktıkların" */
  title?: string
  /** Koyu tema (panel için) — default false (beyaz EsteStore) */
  dark?: boolean
}

export default function RecentlyViewedShelf({
  excludeId,
  limit = 8,
  title = 'Son Baktıkların',
  dark = false,
}: Props) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : []
      setItems(list.filter(i => i.id !== excludeId).slice(0, limit))
    } catch {
      setItems([])
    } finally {
      setReady(true)
    }
  }, [excludeId, limit])

  if (!ready || items.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className={`text-lg sm:text-xl font-bold tracking-[-0.01em] ${dark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>
        <button
          onClick={() => {
            localStorage.removeItem(KEY)
            setItems([])
          }}
          className={`text-sm font-semibold underline ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Temizle
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map(p => {
          const initial = (p.name?.trim()[0] ?? '✦').toUpperCase()
          return (
            <Link
              key={p.id}
              href={`/estestore/${p.slug ?? p.id}`}
              className={`group block overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 ${
                dark
                  ? 'bg-slate-800/50 border-slate-700 hover:border-[#C9A961]/60'
                  : 'bg-white border-slate-200 hover:border-[#C9A961]/60 hover:shadow-md'
              }`}
            >
              <div className={`aspect-square overflow-hidden ${
                dark
                  ? 'bg-slate-900'
                  : 'bg-gradient-to-br from-[#FAFAF7] via-white to-[#F5F0E5]'
              }`}>
                {p.cover ? (
                  <RVImage src={p.cover} alt={p.name} dark={dark} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    {!dark && <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,97,0.10),transparent_55%)]" />}
                    <span className={`relative font-black select-none leading-none text-[64px] tracking-tight ${dark ? 'text-slate-700' : 'text-[#8B7339]/30'}`}>
                      {initial}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className={`text-xs font-semibold line-clamp-2 leading-snug mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {p.name}
                </p>
                <p className={`text-xs font-bold ${dark ? 'text-[#C9A961]' : 'text-slate-700'}`}>
                  {formatTRY(p.price)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
