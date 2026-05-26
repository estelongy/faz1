export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/BackButton'
import ProductCard, { type ProductCardData } from '@/app/estestore/ProductCard'
import { isProfessional, type UserRole } from '@/lib/estestore'

export const metadata: Metadata = { title: 'Favorilerim — Estelongy' }

export default async function FavorilerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?g=estestore&next=/panel/favorilerim')

  const role = (user.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)

  // Favori ürünleri çek (sadece aktif + onaylı + hasta için sarf_medikal hariç)
  const { data: rows } = await supabase
    .from('wishlists')
    .select(`
      product_id,
      created_at,
      products (
        id, slug, name, cover_image_url, images, price,
        category, subcategory, pricing_tiers,
        is_active, approval_status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  type Row = {
    product_id: string
    created_at: string
    products: {
      id: string
      slug: string | null
      name: string
      cover_image_url: string | null
      images: string[] | null
      price: number | string
      category: string
      subcategory: string | null
      pricing_tiers: unknown
      is_active: boolean
      approval_status: string
    } | null
  }

  const products: ProductCardData[] = ((rows ?? []) as Row[])
    .filter(r => r.products && r.products.is_active && r.products.approval_status === 'approved')
    .filter(r => isPro || r.products!.category !== 'sarf_medikal')
    .map(r => ({
      id: r.products!.id,
      slug: r.products!.slug,
      name: r.products!.name,
      cover_image_url: r.products!.cover_image_url ?? r.products!.images?.[0] ?? null,
      price: Number(r.products!.price ?? 0),
      category: r.products!.category as ProductCardData['category'],
      subcategory: r.products!.subcategory,
      pricing_tiers: Array.isArray(r.products!.pricing_tiers)
        ? (r.products!.pricing_tiers as ProductCardData['pricing_tiers'])
        : [],
    }))

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <BackButton href="/panel" label="Panelim" />
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Favorilerim</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-rose-400">♥</span>
            Favorilerim
          </h1>
          <p className="text-slate-400 text-sm">{products.length} ürün</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-rose-400/30 bg-slate-800/50">
            <div className="text-6xl mb-4">💝</div>
            <p className="text-xl font-bold text-white mb-2">Henüz favori ürün yok</p>
            <p className="text-base text-slate-400 max-w-md mx-auto mb-6">
              EsteStore&apos;da beğendiğin ürünlerin sağ üst köşesindeki kalp ikonuna tıklayarak buraya kaydet.
            </p>
            <Link
              href="/estestore"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] text-base font-bold transition-all"
            >
              EsteStore&apos;a Git →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isPro={isPro}
                showPrice={true}
                inWishlist={true}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
