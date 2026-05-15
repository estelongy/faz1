import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  isProfessional,
  getCategoryAccess,
  getSectionBySlug,
  type UserRole,
} from '@/lib/estestore'
import ProductCard, { type ProductCardData } from '../../ProductCard'
import CartButton from '@/components/CartButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  if (slug === 'akademi') return { title: 'Akademi | EsteStore' }
  const section = getSectionBySlug(slug)
  return { title: section ? `${section.label} | EsteStore` : 'EsteStore' }
}

export default async function EsteStoreCategoryPage({ params }: Props) {
  const { slug: urlSlug } = await params

  // Akademi → ayrı modül; redirect.
  if (urlSlug === 'akademi') redirect('/akademi')

  const section = getSectionBySlug(urlSlug)
  if (!section) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)
  const access = getCategoryAccess(section.category, role)

  let query = supabase
    .from('products')
    .select('id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers')
    .eq('category', section.category)
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  if (section.subcategoryIn && section.subcategoryIn.length > 0) {
    query = query.in('subcategory', section.subcategoryIn)
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

  return (
    <main className="min-h-screen bg-white">
      {/* Dark navbar — EsteStore signature (landing + detail + vendor profile ile aynı) */}
      <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/estestore" className="text-base font-semibold text-slate-300 hover:text-white transition-colors shrink-0">← EsteStore</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-base font-bold truncate">{section.label}</span>
          </div>
          <CartButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb — 14 bold */}
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <Link href="/estestore" className="hover:text-slate-900 transition-colors text-[#8B7339]">EsteStore</Link>
        <span>›</span>
        <span className="text-slate-900">{section.label}</span>
      </nav>

      {/* Header */}
      <header className="space-y-3">
        <p
          className="text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color: section.accent }}
        >
          {section.sellerLabel}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 flex items-center gap-3 tracking-[-0.02em]">
          <span>{section.icon}</span> {section.label}
        </h1>
        <p className="text-base text-slate-700 max-w-2xl">{section.description}</p>
        {access.mode === 'preview' && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#C9A961]/10 border border-[#C9A961]/40 text-[#8B7339] text-sm font-semibold">
            <span>🔒</span>
            <span>
              Bu kategori klinik ve sağlık profesyonelleri içindir. Fiyat görmek ve satın almak için{' '}
              <Link href={`/giris?g=estestore&next=/estestore/kategori/${urlSlug}`} className="underline">giriş yapın</Link>.
            </span>
          </div>
        )}
      </header>

      {/* Liste */}
      {items.length === 0 ? (
        <p className="text-base font-semibold text-slate-500 text-center py-16">Bu kategoride henüz ürün yok.</p>
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
