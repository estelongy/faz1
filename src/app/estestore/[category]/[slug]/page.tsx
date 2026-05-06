import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  isProfessional,
  getCategoryAccess,
  buildTierSummary,
  formatTRY,
  formatPercent,
  type EsteStoreCategory,
  type PricingTiers,
  type UserRole,
} from '@/lib/estestore'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ category: string; slug: string }>
}

function urlToCategory(slug: string): EsteStoreCategory | 'akademi' | null {
  if (slug === 'kozmetik') return 'kozmetik'
  if (slug === 'sarf-medikal') return 'sarf_medikal'
  if (slug === 'akademi') return 'akademi'
  return null
}

export async function generateMetadata({ params }: Props) {
  const { category, slug } = await params
  const cat = urlToCategory(category)
  if (!cat || cat === 'akademi') return { title: 'EsteStore' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('category', cat)
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return { title: 'Ürün bulunamadı | EsteStore' }
  return {
    title: `${data.name} | EsteStore`,
    description: data.description ?? undefined,
  }
}

export default async function EsteStoreProductPage({ params }: Props) {
  const { category: urlCategory, slug } = await params
  const cat = urlToCategory(urlCategory)

  if (cat === 'akademi') redirect(`/akademi/${slug}`)
  if (!cat) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)
  const access = getCategoryAccess(cat, role)

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, slug, name, description, ingredients, category, subcategory,
      price, stock, images, cover_image_url, pricing_tiers,
      vendor_id, is_active, approval_status,
      vendors:vendor_id (id, company_name)
    `)
    .eq('category', cat)
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .maybeSingle()

  if (!product) notFound()

  const vendor = product.vendors as unknown as { id: string; company_name: string } | null
  const tiers: PricingTiers = Array.isArray(product.pricing_tiers)
    ? (product.pricing_tiers as PricingTiers)
    : []
  const summary = buildTierSummary(Number(product.price), tiers)
  const cover = product.cover_image_url ?? product.images?.[0] ?? null
  const gallery: string[] = product.images ?? []

  const categoryLabel = cat === 'kozmetik' ? 'Kozmetik' : 'Sarf & Medikal'

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-white">Anasayfa</Link>
        <span>›</span>
        <Link href="/estestore" className="hover:text-white">EsteStore</Link>
        <span>›</span>
        <Link href={`/estestore/${urlCategory}`} className="hover:text-white">{categoryLabel}</Link>
        <span>›</span>
        <span className="text-slate-300 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: görseller + bilgi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-square bg-slate-800 rounded-2xl overflow-hidden border border-slate-800 relative">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={product.name}
                className={`w-full h-full object-cover ${!access.canSeePrice ? 'blur-sm opacity-80' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl opacity-30">
                {cat === 'sarf_medikal' ? '💉' : '🧴'}
              </div>
            )}
            {!access.canSeePrice && (
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                <div className="px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-bold">
                  🔒 Profesyonel ürün
                </div>
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 4).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${product.name} ${i + 1}`}
                  className="aspect-square object-cover rounded-lg bg-slate-800"
                />
              ))}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
              <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-400">
                {categoryLabel}
              </span>
              {product.subcategory && (
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-300 capitalize">
                  {product.subcategory}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-white">{product.name}</h1>
            {vendor && (
              <p className="text-slate-400 text-sm mb-4">
                Satıcı: <span className="text-white font-medium">{vendor.company_name}</span>
              </p>
            )}
            {product.description && (
              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{product.description}</p>
            )}
          </div>

          {product.ingredients && Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-white mb-2">İçerik</h2>
              <div className="flex flex-wrap gap-1.5">
                {(product.ingredients as string[]).map((ing, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: fiyat ve aksiyon */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
              {access.canSeePrice ? (
                <>
                  {isPro && tiers.length > 0 ? (
                    <>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Profesyonel Fiyat</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-500 line-through text-sm">{formatTRY(Number(product.price))}</span>
                          <span className="text-emerald-400 text-3xl font-black">
                            {formatTRY(summary[0]?.unitPrice ?? Number(product.price))}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">
                          1 adet · {formatPercent(tiers[0]?.discount_rate ?? 0)} indirimli
                        </p>
                      </div>

                      <div className="border-t border-slate-800 pt-4">
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Toplu Alım Baremleri</p>
                        <div className="space-y-1.5">
                          {summary.map((row, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">{row.rangeLabel}</span>
                              <div className="text-right">
                                <span className="text-white font-bold">{formatTRY(row.unitPrice)}</span>
                                <span className="text-emerald-400 ml-2 text-xs">{formatPercent(row.rate)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Fiyat</p>
                      <div className="text-white text-3xl font-black">{formatTRY(Number(product.price))}</div>
                      {tiers.length > 0 && (
                        <p className="text-violet-300 text-xs mt-2">
                          Profesyoneller için: {formatTRY(summary[0].unitPrice)} ({formatPercent(tiers[0].discount_rate)} indirim)
                        </p>
                      )}
                    </div>
                  )}

                  {access.canBuy ? (
                    <button
                      type="button"
                      disabled
                      className="block w-full text-center py-3 bg-emerald-600/40 text-emerald-100 font-semibold rounded-xl cursor-not-allowed"
                      title="Sepet ve ödeme yakında"
                    >
                      Sepete Ekle (yakında)
                    </button>
                  ) : (
                    <Link
                      href={`/giris?next=/estestore/${urlCategory}/${slug}`}
                      className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                    >
                      Satın Almak için Giriş Yap
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-slate-600 select-none">••• ₺</div>
                    <p className="text-slate-400 text-sm">
                      Bu kategori klinik ve sağlık profesyonelleri içindir. Fiyat görmek ve satın almak için giriş yapın.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/giris?next=/estestore/${urlCategory}/${slug}`}
                      className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                    >
                      Giriş Yap
                    </Link>
                    <Link
                      href="/kurumsal/saglik-profesyoneli/kayit"
                      className="block w-full text-center py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Sağlık Profesyoneli Kaydı →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Stok & teslimat */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-2 text-xs">
              {product.stock != null && (
                <div className="flex items-center gap-2">
                  <span className={product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {product.stock > 0 ? '✓ Stokta' : '✗ Stok yok'}
                  </span>
                  {product.stock > 0 && (
                    <span className="text-slate-500">({product.stock} adet)</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>Faturalı, kurumsal kargo</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400">✓</span>
                <span>Stripe ile güvenli ödeme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
