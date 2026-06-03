export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isProfessional, type UserRole } from '@/lib/estestore'
import { searchProducts, parseSearchParamsFromUrl } from '@/lib/products-search'
import ProductCard from '../ProductCard'
import EsteStoreToolbar from '@/components/EsteStoreToolbar'
import CartButton from '@/components/CartButton'
import { getUserWishlistSet } from '@/lib/wishlists'

export const metadata: Metadata = { title: 'Arama | EsteStore' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EsteStoreSearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const params = parseSearchParamsFromUrl(sp)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)

  // Hasta kullanıcılar sarf_medikal göremez — arama da bu kısıt altında
  // (category=kozmetik filter empoze ediyoruz pro değilse)
  const searchParams2 = isPro ? params : { ...params, category: 'kozmetik' as const }

  const result = params.q
    ? await searchProducts(searchParams2)
    : { items: [], total: 0, page: 1, perPage: 24, totalPages: 1 }

  const wishlistSet = await getUserWishlistSet(supabase, user?.id)

  return (
    <main className="min-h-screen bg-white">
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/estestore" className="text-base font-semibold text-slate-300 hover:text-white transition-colors shrink-0">← EsteStore</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-base font-bold">Arama</span>
          </div>
          <CartButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <nav className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <Link href="/estestore" className="hover:text-slate-900 transition-colors text-[#8B7339]">EsteStore</Link>
          <span>›</span>
          <span className="text-slate-900">Arama</span>
        </nav>

        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-[-0.02em]">
            {params.q ? <>&quot;{params.q}&quot; için sonuçlar</> : 'Ürün Ara'}
          </h1>
          <p className="text-base text-slate-600">
            {params.q
              ? `${result.total} ürün bulundu`
              : 'Yukarıdaki kutuya ürün adı, marka veya açıklama yazarak ara'}
          </p>
        </header>

        <EsteStoreToolbar total={result.total} showSearch />

        {/* Sonuçlar */}
        {params.q && result.items.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-[#C9A961]/40 bg-gradient-to-br from-[#FAFAF7] to-white">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-bold text-slate-900 mb-2">Sonuç bulunamadı</p>
            <p className="text-base text-slate-600 max-w-md mx-auto mb-6">
              <span className="font-semibold text-[#8B7339]">{params.q}</span> için ürün bulamadık. Daha kısa bir kelime veya farklı yazım dene.
            </p>
            <Link href="/estestore"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] text-base font-bold transition-all">
              EsteStore&apos;a dön →
            </Link>
          </div>
        ) : params.q ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {result.items.map(p => (
                <ProductCard key={p.id} product={p} isPro={isPro} showPrice={true} inWishlist={wishlistSet.has(p.id)} />
              ))}
            </div>

            {/* Sayfalama */}
            {result.totalPages > 1 && (
              <Pagination page={result.page} totalPages={result.totalPages} basePath="/estestore/ara" sp={sp} />
            )}
          </>
        ) : null}
      </div>
    </main>
  )
}

function Pagination({ page, totalPages, basePath, sp }: {
  page: number
  totalPages: number
  basePath: string
  sp: Record<string, string | string[] | undefined>
}) {
  function buildHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) {
      if (k === 'sayfa') continue
      if (typeof v === 'string') params.set(k, v)
    }
    if (p > 1) params.set('sayfa', String(p))
    return `${basePath}${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {page > 1 && (
        <Link href={buildHref(page - 1)}
          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:border-[#C9A961]">
          ← Önceki
        </Link>
      )}
      <span className="text-slate-500 text-sm font-semibold">
        Sayfa <strong className="text-slate-900">{page}</strong> / {totalPages}
      </span>
      {page < totalPages && (
        <Link href={buildHref(page + 1)}
          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:border-[#C9A961]">
          Sonraki →
        </Link>
      )}
    </div>
  )
}
