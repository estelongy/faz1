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
  const categorySlug = product.category === 'sarf_medikal' ? 'sarf-medikal' : product.category
  const href = hrefOverride ?? `/estestore/${categorySlug}/${product.slug ?? product.id}`

  const tiers = product.pricing_tiers ?? []
  const summary = buildTierSummary(product.price, tiers)
  const firstTier = tiers[0]
  const proPriceFromFirstTier = firstTier
    ? Math.round(product.price * (1 - firstTier.discount_rate) * 100) / 100
    : null

  return (
    <Link
      href={href}
      className="group flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all"
    >
      {/* Görsel */}
      <div className="aspect-square bg-slate-800 overflow-hidden relative">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              !showPrice ? 'blur-[2px] opacity-80' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            {product.category === 'sarf_medikal' ? '💉' : '🧴'}
          </div>
        )}

        {!showPrice && (
          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              🔒 Profesyonel
            </div>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="p-4 flex-1 flex flex-col">
        {product.subcategory && (
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
            {product.subcategory}
          </p>
        )}
        <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-3">
          {product.name}
        </h3>

        {/* Fiyat alanı — role'a göre değişir */}
        <div className="mt-auto">
          {!showPrice ? (
            <div className="text-xs text-slate-500 italic">
              Fiyat için <span className="text-violet-300 font-semibold">giriş yapın</span>
            </div>
          ) : isPro && firstTier && proPriceFromFirstTier !== null ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-slate-500 text-xs line-through">{formatTRY(product.price)}</span>
                <span className="text-emerald-400 font-black text-lg">
                  {formatTRY(proPriceFromFirstTier)}
                </span>
              </div>
              {/* 3 baremlik özet — klinik tek bakışta görsün */}
              {summary.length > 0 && (
                <div className="border-t border-slate-800 pt-2 space-y-0.5">
                  {summary.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-500">{row.rangeLabel}</span>
                      <span className="text-slate-300 font-medium">
                        {formatTRY(row.unitPrice)}
                        <span className="text-emerald-400/80 ml-1">
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
              <div className="text-white font-black text-lg mb-1">
                {formatTRY(product.price)}
              </div>
              {firstTier && proPriceFromFirstTier !== null && (
                <p className="text-[11px] text-slate-500">
                  Profesyonel: {formatTRY(proPriceFromFirstTier)} ({formatPercent(firstTier.discount_rate)} indirim)
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
