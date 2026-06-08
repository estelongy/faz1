/**
 * EsteStore ürün arama & filtreleme yardımcısı.
 *
 * URL search params → Supabase query builder → ProductCardData[]
 * Hem /estestore/ara hem /estestore/kategori/[slug] kullanır.
 *
 * Server-only.
 */

import { createClient } from '@/lib/supabase/server'
import type { ProductCardData } from '@/app/estestore/ProductCard'
import type { EsteStoreCategory } from '@/lib/estestore'

export type SortKey = 'yeni' | 'eski' | 'fiyat-artan' | 'fiyat-azalan' | 'ep-yuksek' | 'cok-satan'

export interface ProductSearchParams {
  /** Serbest metin arama (name + description ilike) */
  q?: string
  /** Ana kategori filtresi — kozmetik / sarf_medikal */
  category?: EsteStoreCategory
  /** Alt kategori — birden fazla olabilir */
  subcategoryIn?: string[]
  /** Tek alt kategori (kestirme — subcategoryIn ile çelişmemeli) */
  subcategory?: string
  /** Fiyat aralığı (TRY) */
  minPrice?: number
  maxPrice?: number
  /** EP skor eşiği (>=) — products.final_score */
  minEp?: number
  /** Sadece stoklu (stock > 0 veya NULL — stock NULL = sınırsız varsayalım) */
  onlyInStock?: boolean
  /** Sıralama */
  sort?: SortKey
  /** Sayfa numarası (1-based) */
  page?: number
  /** Sayfa başına */
  perPage?: number
  /** Klinik-only ürünleri dahil et (true = isPro). Varsayılan false (hasta görünümü). */
  includeKlinikOnly?: boolean
}

export interface ProductSearchResult {
  items: ProductCardData[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

const DEFAULT_PER_PAGE = 24

/** URL searchParams (next.js'in döndürdüğü düz object) → tip-güvenli ProductSearchParams */
export function parseSearchParamsFromUrl(sp: Record<string, string | string[] | undefined>): ProductSearchParams {
  function s(key: string): string | undefined {
    const v = sp[key]
    if (Array.isArray(v)) return v[0]
    return v
  }
  function n(key: string): number | undefined {
    const v = s(key)
    if (!v) return undefined
    const num = Number(v)
    return Number.isFinite(num) ? num : undefined
  }
  return {
    q:           s('q')?.trim() || undefined,
    minPrice:    n('minFiyat'),
    maxPrice:    n('maxFiyat'),
    minEp:       n('minEp'),
    onlyInStock: s('stok') === '1' || undefined,
    sort:        (s('sira') as SortKey) || undefined,
    page:        n('sayfa'),
  }
}

/** Filtre/sıralamadan herhangi biri aktif mi? */
export function hasActiveFilters(p: ProductSearchParams): boolean {
  return !!(
    p.q ||
    p.minPrice !== undefined ||
    p.maxPrice !== undefined ||
    p.minEp !== undefined ||
    p.onlyInStock ||
    (p.sort && p.sort !== 'yeni')
  )
}

export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const perPage = params.perPage ?? DEFAULT_PER_PAGE
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('products')
    .select(
      'id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers, final_score, stock, description, klinik_only',
      { count: 'exact' }
    )
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .range(from, to)

  // klinik_only ürünler sadece klinik/health_pro/admin için görünür
  if (!params.includeKlinikOnly) {
    query = query.eq('klinik_only', false)
  }

  // Kategori
  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.subcategory) {
    query = query.eq('subcategory', params.subcategory)
  } else if (params.subcategoryIn && params.subcategoryIn.length > 0) {
    query = query.in('subcategory', params.subcategoryIn)
  }

  // Serbest metin: name veya description ilike
  if (params.q) {
    const safe = params.q.replace(/[%_]/g, '\\$&') // ilike escape
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
  }

  // Fiyat
  if (params.minPrice !== undefined) query = query.gte('price', params.minPrice)
  if (params.maxPrice !== undefined) query = query.lte('price', params.maxPrice)

  // EP eşiği
  if (params.minEp !== undefined) query = query.gte('final_score', params.minEp)

  // Stok — stock NULL ise sınırsız varsay (yine listelenir)
  if (params.onlyInStock) {
    query = query.or('stock.is.null,stock.gt.0')
  }

  // Sıralama
  switch (params.sort ?? 'yeni') {
    case 'yeni':         query = query.order('created_at', { ascending: false }); break
    case 'eski':         query = query.order('created_at', { ascending: true  }); break
    case 'fiyat-artan':  query = query.order('price',      { ascending: true  }); break
    case 'fiyat-azalan': query = query.order('price',      { ascending: false }); break
    case 'ep-yuksek':    query = query.order('final_score', { ascending: false, nullsFirst: false }); break
    case 'cok-satan':    query = query.order('final_score', { ascending: false, nullsFirst: false }); break // TODO: gerçek satış sayacı kolonu açılınca
    default:             query = query.order('created_at', { ascending: false })
  }

  const { data, count } = await query

  const items: ProductCardData[] = (data ?? []).map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    cover_image_url: p.cover_image_url ?? p.images?.[0] ?? null,
    price: Number(p.price ?? 0),
    category: p.category as ProductCardData['category'],
    subcategory: p.subcategory,
    pricing_tiers: Array.isArray(p.pricing_tiers)
      ? (p.pricing_tiers as ProductCardData['pricing_tiers'])
      : [],
    klinik_only: Boolean((p as { klinik_only?: boolean | null }).klinik_only),
  }))

  const total = count ?? items.length
  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}
