import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  isProfessional,
  getCategoryAccess,
  type EsteStoreCategory,
  type UserRole,
} from '@/lib/estestore'
import ProductCard, { type ProductCardData } from '../ProductCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ category: string }>
}

function urlToCategory(slug: string): EsteStoreCategory | 'akademi' | null {
  if (slug === 'kozmetik') return 'kozmetik'
  if (slug === 'sarf-medikal') return 'sarf_medikal'
  if (slug === 'akademi') return 'akademi'
  return null
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params
  const cat = urlToCategory(category)
  if (cat === 'kozmetik') return { title: 'Kozmetik | EsteStore' }
  if (cat === 'sarf_medikal') return { title: 'Sarf & Medikal | EsteStore' }
  return { title: 'EsteStore' }
}

export default async function EsteStoreCategoryPage({ params }: Props) {
  const { category: urlCategory } = await params
  const cat = urlToCategory(urlCategory)

  if (cat === 'akademi') redirect('/akademi')
  if (!cat) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)
  const access = getCategoryAccess(cat, role)

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers')
    .eq('category', cat)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

  const items: ProductCardData[] = (products ?? []).map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    cover_image_url: p.cover_image_url ?? p.images?.[0] ?? null,
    price: Number(p.price),
    category: p.category as EsteStoreCategory,
    subcategory: p.subcategory,
    pricing_tiers: Array.isArray(p.pricing_tiers)
      ? (p.pricing_tiers as ProductCardData['pricing_tiers'])
      : [],
  }))

  const categoryLabel = cat === 'kozmetik' ? 'Kozmetik' : 'Sarf & Medikal'
  const icon = cat === 'kozmetik' ? '🧴' : '💉'
  const sellerLabel = cat === 'kozmetik' ? 'Markalar' : 'Tedarikçiler'

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-white transition-colors">Anasayfa</Link>
        <span>›</span>
        <Link href="/estestore" className="hover:text-white transition-colors">EsteStore</Link>
        <span>›</span>
        <span className="text-slate-300">{categoryLabel}</span>
      </nav>

      {/* Header */}
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          {sellerLabel}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
          <span>{icon}</span> {categoryLabel}
        </h1>
        {access.mode === 'preview' && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <span>🔒</span>
            <span>
              Bu kategori klinik ve sağlık profesyonelleri içindir. Fiyat görmek ve satın almak için{' '}
              <Link href={`/giris?next=/estestore/${urlCategory}`} className="underline font-semibold">giriş yapın</Link>.
            </span>
          </div>
        )}
      </header>

      {/* Liste */}
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-16">Bu kategoride henüz ürün yok.</p>
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
    </main>
  )
}
