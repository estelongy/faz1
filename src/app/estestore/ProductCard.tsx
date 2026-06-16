import Link from 'next/link'
import {
  formatTRY,
  formatPercent,
  buildTierSummary,
  type EsteStoreCategory,
  type PricingTiers,
} from '@/lib/estestore'
import WishlistButton from '@/components/WishlistButton'
import ProductCardImage from './ProductCardImage'

export interface ProductCardData {
  id: string
  slug: string | null
  name: string
  cover_image_url?: string | null
  price: number
  category: EsteStoreCategory
  subcategory?: string | null
  pricing_tiers?: PricingTiers | null
  klinik_only?: boolean
}

interface Props {
  product: ProductCardData
  /** Profesyonel mi (clinic/health_pro/admin)? */
  isPro: boolean
  /** Fiyat görünürlüğü — preview moddaysa false */
  showPrice: boolean
  /** Tıklandığında /estestore/[category]/[slug] yerine başka URL'e yönlendirilecekse */
  hrefOverride?: string
  /** Kullanıcının favori listesinde mi (server'dan gelir) */
  inWishlist?: boolean
  /** Kalp ikonu göster/gizle — preview modunda gizleyebiliriz */
  showWishlist?: boolean
}

export default function ProductCard({ product, isPro, showPrice, hrefOverride, inWishlist = false, showWishlist = true }: Props) {
  const href = hrefOverride ?? `/estestore/${product.slug ?? product.id}`

  const tiers = product.pricing_tiers ?? []
  const summary = buildTierSummary(product.price, tiers)
  const firstTier = tiers[0]
  const proPriceFromFirstTier = firstTier
    ? Math.round(product.price * (1 - firstTier.discount_rate) * 100) / 100
    : null

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden active:border-[#C9A961]/60 hover:border-[#C9A961]/60 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5 transition-all"
    >
      {/* Görsel */}
      <div className="aspect-square bg-gradient-to-br from-[#FAFAF7] via-white to-[#F5F0E5] overflow-hidden relative">
        {showWishlist && (
          <WishlistButton
            productId={product.id}
            initialInWishlist={inWishlist}
            loginRedirect={href}
            variant="card"
          />
        )}
        <ProductCardImage src={product.cover_image_url} alt={product.name} dim={!showPrice} />

        {!showPrice && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-[#C9A961]/15 border border-[#C9A961]/40 text-[#8B7339] text-sm font-semibold">
              🔒 Profesyonel
            </div>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          {product.subcategory ? (
            <span className="inline-block text-[10px] uppercase tracking-[0.14em] text-[#8B7339] font-bold bg-[#C9A961]/10 px-2 py-0.5 rounded-md">
              {product.subcategory}
            </span>
          ) : <span />}
          {isPro && product.klinik_only && (
            <span className="shrink-0 bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold border border-emerald-200">
              Kliniğe Özel
            </span>
          )}
        </div>
        <h3 className="text-slate-900 text-sm font-semibold leading-snug line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* Fiyat alanı */}
        <div className="mt-auto">
          {!showPrice ? (
            <div className="text-sm text-slate-500">
              Fiyat için <span className="text-[#8B7339] font-semibold">giriş yapın</span>
            </div>
          ) : isPro && firstTier && proPriceFromFirstTier !== null ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-slate-400 text-sm line-through">{formatTRY(product.price)}</span>
                <span className="text-[#10876B] font-bold text-lg">
                  {formatTRY(proPriceFromFirstTier)}
                </span>
              </div>
              {summary.length > 0 && (
                <div className="border-t border-slate-200 pt-2 space-y-0.5">
                  {summary.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-500">{row.rangeLabel}</span>
                      <span className="text-slate-700 font-medium">
                        {formatTRY(row.unitPrice)}
                        <span className="text-[#10876B] ml-1">
                          {formatPercent(row.rate)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-900 font-bold text-lg mb-1">
              {formatTRY(product.price)}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
