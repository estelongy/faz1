import Link from 'next/link'
import {
  formatTRY,
  formatPercent,
  buildTierSummary,
  type EsteStoreCategory,
  type PricingTiers,
} from '@/lib/estestore'

export interface ProductCardData {
  id: string
  slug: string | null
  name: string
  cover_image_url?: string | null
  price: number
  category: EsteStoreCategory
  subcategory?: string | null
  pricing_tiers?: PricingTiers | null
}

interface Props {
  product: ProductCardData
  /** Profesyonel mi (clinic/health_pro/admin)? */
  isPro: boolean
  /** Fiyat görünürlüğü — preview moddaysa false */
  showPrice: boolean
  /** Tıklandığında /estestore/[category]/[slug] yerine başka URL'e yönlendirilecekse */
  hrefOverride?: string
}

export default function ProductCard({ product, isPro, showPrice, hrefOverride }: Props) {
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
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#C9A961]/60 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5 transition-all"
    >
      {/* Görsel */}
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              !showPrice ? 'blur-[2px] opacity-80' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
            {product.category === 'sarf_medikal' ? '💉' : '🧴'}
          </div>
        )}

        {!showPrice && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-[#C9A961]/15 border border-[#C9A961]/40 text-[#8B7339] text-sm font-semibold">
              🔒 Profesyonel
            </div>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="p-4 flex-1 flex flex-col">
        {product.subcategory && (
          <p className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">
            {product.subcategory}
          </p>
        )}
        <h3 className="text-slate-900 text-sm font-semibold leading-snug line-clamp-2 mb-3">
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
            <>
              <div className="text-slate-900 font-bold text-lg mb-1">
                {formatTRY(product.price)}
              </div>
              {firstTier && proPriceFromFirstTier !== null && (
                <p className="text-sm text-slate-500">
                  Profesyonel: <span className="text-[#10876B] font-medium">{formatTRY(proPriceFromFirstTier)}</span> ({formatPercent(firstTier.discount_rate)} indirim)
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
