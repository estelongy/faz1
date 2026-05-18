import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  isProfessional,
  getCategoryAccess,
  getSectionBySlug,
  type UserRole,
} from '@/lib/estestore'
import { HASTA_CATEGORIES, KLINIK_CATEGORIES_FLAT, type StoreCategory } from '@/lib/estestore-categories'
import ProductCard, { type ProductCardData } from '../../ProductCard'
import CartButton from '@/components/CartButton'

import SafeLink from '@/components/SafeLink'
export const dynamic = 'force-dynamic'

/** estestore-categories'deki 42 kategoriden slug eşleşmesi bul */
function findStoreCategory(slug: string): { cat: StoreCategory; ana: 'kozmetik' | 'sarf_medikal' } | null {
  const hasta = HASTA_CATEGORIES.find(c => c.slug === slug)
  if (hasta) return { cat: hasta, ana: 'kozmetik' }
  const klinik = KLINIK_CATEGORIES_FLAT.find(c => c.slug === slug)
  if (klinik) return { cat: klinik, ana: 'sarf_medikal' }
  return null
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  if (slug === 'akademi') return { title: 'Akademi | EsteStore' }
  const section = getSectionBySlug(slug)
  if (section) return { title: `${section.label} | EsteStore` }
  const storeCat = findStoreCategory(slug)
  return { title: storeCat ? `${storeCat.cat.name} | EsteStore` : 'EsteStore' }
}

export default async function EsteStoreCategoryPage({ params }: Props) {
  const { slug: urlSlug } = await params

  // Akademi → ayrı modül; redirect.
  if (urlSlug === 'akademi') redirect('/akademi')

  // 1. Önce ESTESTORE_SECTIONS'a bak (longevity, islem-sonrasi, biyohacking-olcum, kozmetik, sarf-medikal)
  const section = getSectionBySlug(urlSlug)

  // 2. Yoksa estestore-categories'deki 42 kategoriden ara (hassas-cilt, anti-aging, makyaj, vs.)
  const storeCategory = section ? null : findStoreCategory(urlSlug)

  // Hiçbir yerde bulunamadı → 404
  if (!section && !storeCategory) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)

  // Section varsa onun ana category'sini, yoksa storeCategory'nin ana'sını kullan
  const anaCategory = section ? section.category : storeCategory!.ana
  const access = getCategoryAccess(anaCategory, role)

  // sarf_medikal kategorisi (24 klinik kategori dahil) hasta kullanıcıya tamamen kapalı.
  if (access.mode === 'blocked') notFound()

  let query = supabase
    .from('products')
    .select('id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers')
    .eq('category', anaCategory)
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  if (section?.subcategoryIn && section.subcategoryIn.length > 0) {
    query = query.in('subcategory', section.subcategoryIn)
  } else if (storeCategory) {
    // storeCategory mode: slug = subcategory eşleşmesi
    query = query.eq('subcategory', storeCategory.cat.slug)
  }

  const { data: products } = await query.order('created_at', { ascending: false })

  const items: ProductCardData[] = (products ?? []).map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    cover_image_url: p.cover_image_url ?? p.images?.[0] ?? null,
    price: Number(p.price),
    category: p.category as ProductCardData['category'],
    subcategory: p.subcategory,
    pricing_tiers: Array.isArray(p.pricing_tiers)
      ? (p.pricing_tiers as ProductCardData['pricing_tiers'])
      : [],
  }))

  // Header bilgileri — section ya da storeCategory'den çek
  const headerLabel = section?.label ?? storeCategory!.cat.name
  const headerEyebrow = section?.sellerLabel ?? 'EsteStore Kategorisi'
  const headerIcon = section?.icon ?? '✦'
  const headerDescription = section?.description ?? storeCategory!.cat.description
  const headerAccent = section?.accent ?? '#8B7339'

  return (
    <main className="min-h-screen bg-white">
      {/* Dark navbar — EsteStore signature (landing + detail + vendor profile ile aynı) */}
      <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/estestore" className="text-base font-semibold text-slate-300 hover:text-white transition-colors shrink-0">← EsteStore</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-base font-bold truncate">{headerLabel}</span>
          </div>
          <CartButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb — 14 bold */}
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <Link href="/estestore" className="hover:text-slate-900 transition-colors text-[#8B7339]">EsteStore</Link>
        <span>›</span>
        <span className="text-slate-900">{headerLabel}</span>
      </nav>

      {/* Header */}
      <header className="space-y-3">
        <p
          className="text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color: headerAccent }}
        >
          {headerEyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 flex items-center gap-3 tracking-[-0.02em]">
          <span>{headerIcon}</span> {headerLabel}
        </h1>
        <p className="text-base text-slate-700 max-w-2xl">{headerDescription}</p>
        {access.mode === 'preview' && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#C9A961]/10 border border-[#C9A961]/40 text-[#8B7339] text-sm font-semibold">
            <span>🔒</span>
            <span>
              Bu kategori klinik ve sağlık profesyonelleri içindir. Fiyat görmek ve satın almak için{' '}
              <SafeLink href={`/giris?g=estestore&next=/estestore/kategori/${urlSlug}`} className="underline">giriş yapın</SafeLink>.
            </span>
          </div>
        )}
      </header>

      {/* Liste */}
      {items.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-[#C9A961]/40 bg-gradient-to-br from-[#FAFAF7] to-white">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-xl font-bold text-slate-900 mb-2">Bu kategori yakında dolacak</p>
          <p className="text-base text-slate-600 max-w-md mx-auto mb-6">
            <span className="font-semibold text-[#8B7339]">{headerLabel}</span> için iş ortaklarımız hazırlanıyor. Çok yakında EP-skorlu ürünleri burada göreceksin.
          </p>
          <Link href="/estestore"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] text-base font-bold shadow-lg shadow-[#C9A961]/30 transition-all">
            EsteStore&apos;a dön →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              isPro={isPro}
              showPrice={access.canSeePrice}
            />
          ))}
        </div>
      )}
      </div>
    </main>
  )
}
